import { beforeEach, describe, expect, it, vi } from "vitest";

const orderState: Record<string, any> = {
  id: "order-1",
  user_id: "user-1",
  course_id: "course-1",
  status: "pending",
  provider_payment_id: null,
  raw_response: null
};

let insertedEnrollment: Record<string, unknown> | null = null;

vi.mock("../src/lib/mercadopago.js", () => ({
  createMercadoPagoPreference: vi.fn(),
  getMercadoPagoPayment: vi.fn(async () => ({
    id: "payment-1",
    status: "approved",
    external_reference: "order-1"
  }))
}));

vi.mock("../src/lib/moodle.js", () => ({
  createOrFindMoodleUser: vi.fn(async () => null),
  enrollUserInCourse: vi.fn(async () => null)
}));

vi.mock("../src/modules/courses/courses.service.js", () => ({
  getPublishedCourseById: vi.fn()
}));

vi.mock("../src/lib/insforge.js", () => ({
  getInsforgeServiceClient: () => ({
    from: (table: string) => {
      if (table === "payment_orders") {
        return {
          select: () => ({
            eq: (_field: string, value: string) => ({
              maybeSingle: async () => ({
                data: value === "order-1" ? orderState : null,
                error: null
              })
            })
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: (_field: string, value: string) => {
              if (value !== orderState["id"]) {
                throw new Error("Unexpected order id");
              }

              Object.assign(orderState, payload);
              return {
                select: () => ({
                  single: async () => ({
                    data: orderState,
                    error: null
                  })
                })
              };
            }
          })
        };
      }

      if (table === "enrollments") {
        return {
          select: () => ({
            eq: (_fieldA: string, _valueA: string) => ({
              eq: (_fieldB: string, _valueB: string) => ({
                maybeSingle: async () => ({
                  data: null,
                  error: null
                })
              })
            })
          }),
          insert: async (payload: Record<string, unknown>) => {
            insertedEnrollment = payload;
            return { error: null };
          }
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }
  })
}));

import { handleMercadoPagoWebhook } from "../src/modules/payments/payments.service.js";

describe("handleMercadoPagoWebhook", () => {
  beforeEach(() => {
    orderState["status"] = "pending";
    orderState["provider_payment_id"] = null;
    orderState["raw_response"] = null;
    insertedEnrollment = null;
    vi.clearAllMocks();
  });

  it("approves order and creates active enrollment", async () => {
    const result = await handleMercadoPagoWebhook("payment-1");

    expect(result).toEqual({ ok: true });
    expect(orderState["status"]).toBe("approved");
    expect(insertedEnrollment).toMatchObject({
      user_id: "user-1",
      course_id: "course-1",
      status: "active"
    });
  });
});
