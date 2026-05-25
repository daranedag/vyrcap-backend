import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

type MercadoPagoPreferencePayload = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: "CLP";
  external_reference: string;
  notification_url: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  metadata: Record<string, unknown>;
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`
  };
}

export async function createMercadoPagoPreference(payload: MercadoPagoPreferencePayload) {
  const response = await fetch(`${MERCADO_PAGO_API_URL}/checkout/preferences`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      items: [
        {
          title: payload.title,
          quantity: payload.quantity,
          unit_price: payload.unit_price,
          currency_id: payload.currency_id
        }
      ],
      external_reference: payload.external_reference,
      notification_url: payload.notification_url,
      back_urls: payload.back_urls,
      metadata: payload.metadata
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(502, "Mercado Pago preference request failed", "mercadopago_preference_error", data);
  }

  return data;
}

export async function getMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`${MERCADO_PAGO_API_URL}/v1/payments/${paymentId}`, {
    method: "GET",
    headers: authHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(502, "Mercado Pago payment lookup failed", "mercadopago_payment_error", data);
  }

  return data;
}
