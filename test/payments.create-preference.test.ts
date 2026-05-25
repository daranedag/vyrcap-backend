import { beforeEach, describe, expect, it, vi } from "vitest";

const mpPreferenceResponse = {
  id: "pref_123",
  init_point: "https://mp/init",
  sandbox_init_point: "https://mp/sandbox"
};

const courseRow = {
  id: "58c3b6df-0a0e-4d16-a785-50d7d6d7f9a2",
  title: "Curso Pagado",
  price_clp: 99000
};

let insertedOrderPayload: Record<string, unknown> | null = null;
let updatedOrderPayload: Record<string, unknown> | null = null;

vi.mock("../src/modules/courses/courses.service.js", () => ({
  getPublishedCourseById: vi.fn(async () => courseRow)
}));

vi.mock("../src/lib/mercadopago.js", () => ({
  createMercadoPagoPreference: vi.fn(async () => mpPreferenceResponse),
  getMercadoPagoPayment: vi.fn()
}));

vi.mock("../src/lib/moodle.js", () => ({
  createOrFindMoodleUser: vi.fn(async () => null),
  enrollUserInCourse: vi.fn(async () => null)
}));

vi.mock("../src/lib/insforge.js", () => ({
  getInsforgeServiceClient: () => ({
    from: (table: string) => {
      if (table === "payment_providers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: "provider-1" }, error: null })
            })
          })
        };
      }

      if (table === "payment_orders") {
        return {
          insert: (payload: Record<string, unknown>) => {
            insertedOrderPayload = payload;
            return {
              select: () => ({
                single: async () => ({
                  data: {
                    id: "order-1",
                    ...payload
                  },
                  error: null
                })
              })
            };
          },
          update: (payload: Record<string, unknown>) => {
            updatedOrderPayload = payload;
            return {
              eq: async () => ({ error: null })
            };
          }
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  })
}));

import { createPaymentPreference } from "../src/modules/payments/payments.service.js";
import { createMercadoPagoPreference } from "../src/lib/mercadopago.js";

describe("createPaymentPreference", () => {
  beforeEach(() => {
    insertedOrderPayload = null;
    updatedOrderPayload = null;
    vi.clearAllMocks();
  });

  it("creates order from db price and requests Mercado Pago preference", async () => {
    const result = await createPaymentPreference(
      {
        courseId: "58c3b6df-0a0e-4d16-a785-50d7d6d7f9a2",
        userId: "user-from-body"
      },
      "user-from-token"
    );

    expect(insertedOrderPayload?.["amount_clp"]).toBe(99000);
    expect(insertedOrderPayload?.["user_id"]).toBe("user-from-token");
    expect(createMercadoPagoPreference).toHaveBeenCalledTimes(1);
    expect(updatedOrderPayload?.["status"]).toBe("pending");
    expect(result).toEqual({
      order_id: "order-1",
      preference_id: "pref_123",
      init_point: "https://mp/init",
      sandbox_init_point: "https://mp/sandbox"
    });
  });
});
