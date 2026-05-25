import { env } from "../../config/env.js";
import { createMercadoPagoPreference, getMercadoPagoPayment } from "../../lib/mercadopago.js";
import { createOrFindMoodleUser, enrollUserInCourse } from "../../lib/moodle.js";
import { getInsforgeServiceClient } from "../../lib/insforge.js";
import { ApiError } from "../../utils/http.js";
import { getPublishedCourseById } from "../courses/courses.service.js";
import type { CreatePreferenceInput } from "./mercadopago.schema.js";

type PaymentOrderRow = {
  id: string;
  user_id: string | null;
  course_id: string;
  status: string;
  provider_payment_id: string | null;
  raw_response: unknown;
};

function mapMercadoPagoStatus(status: string | undefined): string {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "in_process":
    case "in_mediation":
    case "pending":
      return "pending";
    default:
      return "pending";
  }
}

export async function getOwnPaymentOrders(userId: string) {
  const client = getInsforgeServiceClient();
  const { data, error } = await client
    .from("payment_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError(500, "Could not load payment orders", "payment_orders_error", error);
  }

  return data ?? [];
}

export async function createPaymentPreference(input: CreatePreferenceInput, authenticatedUserId?: string) {
  const client = getInsforgeServiceClient();
  const course = await getPublishedCourseById(input.courseId);
  const selectedUserId = authenticatedUserId ?? input.userId ?? null;

  const { data: providerData } = await client.from("payment_providers").select("id").eq("name", "mercadopago").maybeSingle();
  const providerId = providerData?.id ?? "mercadopago";

  const { data: createdOrder, error: orderError } = await client
    .from("payment_orders")
    .insert({
      provider_id: providerId,
      user_id: selectedUserId,
      course_id: course.id,
      amount_clp: course.price_clp,
      status: "created",
      raw_request: input
    })
    .select("*")
    .single();

  if (orderError || !createdOrder) {
    throw new ApiError(500, "Could not create payment order", "payment_order_create_error", orderError);
  }

  try {
    const preference = await createMercadoPagoPreference({
      title: course.title,
      quantity: 1,
      unit_price: Number(course.price_clp ?? 0),
      currency_id: "CLP",
      external_reference: createdOrder.id,
      notification_url: env.MERCADO_PAGO_WEBHOOK_URL,
      back_urls: {
        success: `${env.PUBLIC_SITE_URL}/?payment=success`,
        failure: `${env.PUBLIC_SITE_URL}/?payment=failure`,
        pending: `${env.PUBLIC_SITE_URL}/?payment=pending`
      },
      metadata: {
        course_id: course.id,
        user_id: selectedUserId,
        payment_order_id: createdOrder.id
      }
    });

    const { error: updateError } = await client
      .from("payment_orders")
      .update({
        provider_order_id: preference.id ?? null,
        checkout_url: preference.init_point ?? preference.sandbox_init_point ?? null,
        status: "pending",
        raw_response: preference
      })
      .eq("id", createdOrder.id);

    if (updateError) {
      throw new ApiError(500, "Could not update payment order after Mercado Pago response", "payment_order_update_error", updateError);
    }

    return {
      order_id: createdOrder.id,
      preference_id: String(preference.id ?? ""),
      init_point: preference.init_point ?? "",
      sandbox_init_point: preference.sandbox_init_point ?? ""
    };
  } catch (error) {
    await client
      .from("payment_orders")
      .update({
        status: "rejected",
        raw_response: error instanceof Error ? { message: error.message } : error
      })
      .eq("id", createdOrder.id);

    throw error;
  }
}

async function ensureEnrollmentActive(order: PaymentOrderRow) {
  if (!order.user_id || !order.course_id) {
    return;
  }

  const client = getInsforgeServiceClient();
  const nowIso = new Date().toISOString();
  const { data: currentEnrollment } = await client
    .from("enrollments")
    .select("*")
    .eq("user_id", order.user_id)
    .eq("course_id", order.course_id)
    .maybeSingle();

  if (!currentEnrollment) {
    const { error: insertError } = await client.from("enrollments").insert({
      user_id: order.user_id,
      course_id: order.course_id,
      status: "active",
      enrolled_at: nowIso
    });

    if (insertError) {
      throw new ApiError(500, "Could not create enrollment", "enrollment_create_error", insertError);
    }
  } else if (currentEnrollment.status !== "active") {
    const { error: updateError } = await client
      .from("enrollments")
      .update({
        status: "active",
        enrolled_at: currentEnrollment.enrolled_at ?? nowIso
      })
      .eq("id", currentEnrollment.id);

    if (updateError) {
      throw new ApiError(500, "Could not update enrollment", "enrollment_update_error", updateError);
    }
  }

  try {
    await createOrFindMoodleUser({ fullName: null, phone: null });
    await enrollUserInCourse({ userId: order.user_id, courseId: order.course_id });
  } catch (error) {
    await client
      .from("payment_orders")
      .update({
        raw_response: {
          payment: order.raw_response,
          moodle_error: error instanceof Error ? error.message : String(error)
        }
      })
      .eq("id", order.id);
  }
}

function resolveOrderIdFromPayment(payment: any): string | null {
  const direct = payment?.external_reference;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }

  const fromMetadata = payment?.metadata?.payment_order_id;
  if (typeof fromMetadata === "string" && fromMetadata.trim().length > 0) {
    return fromMetadata;
  }

  return null;
}

export async function handleMercadoPagoWebhook(paymentId: string) {
  const client = getInsforgeServiceClient();
  const payment = await getMercadoPagoPayment(paymentId);
  const orderId = resolveOrderIdFromPayment(payment);

  if (!orderId) {
    return { ok: true };
  }

  const { data: orderData } = await client.from("payment_orders").select("*").eq("id", orderId).maybeSingle();
  if (!orderData) {
    return { ok: true };
  }

  const order = orderData as PaymentOrderRow;
  if (order.status === "approved") {
    return { ok: true };
  }

  const nextStatus = mapMercadoPagoStatus(payment.status);
  const { data: updatedData, error: updateError } = await client
    .from("payment_orders")
    .update({
      provider_payment_id: String(payment.id ?? paymentId),
      status: nextStatus,
      raw_response: payment
    })
    .eq("id", order.id)
    .select("*")
    .single();

  if (updateError || !updatedData) {
    throw new ApiError(500, "Could not update payment order from webhook", "payment_order_webhook_update_error", updateError);
  }

  if (nextStatus === "approved") {
    await ensureEnrollmentActive(updatedData as PaymentOrderRow);
  }

  return { ok: true };
}
