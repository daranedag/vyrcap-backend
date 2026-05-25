import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/auth.js";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/http.js";
import { mercadoPagoWebhookHandler } from "./mercadopago.controller.js";
import { createPreferenceSchema } from "./mercadopago.schema.js";
import { createPaymentPreference, getOwnPaymentOrders } from "./payments.service.js";

const paymentRateLimit = createRateLimit({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "payments"
});

export const paymentsRouter = Router();
export const mePaymentsRouter = Router();

paymentsRouter.post(
  "/mercadopago/create-preference",
  optionalAuthMiddleware,
  paymentRateLimit,
  asyncHandler(async (req, res) => {
    const parsed = createPreferenceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid payment payload", "validation_error", parsed.error.flatten());
    }

    const tokenUserId = req.user?.id;
    const data = await createPaymentPreference(parsed.data, tokenUserId);
    res.json(data);
  })
);

paymentsRouter.get("/mercadopago/webhook", asyncHandler(mercadoPagoWebhookHandler));
paymentsRouter.post("/mercadopago/webhook", asyncHandler(mercadoPagoWebhookHandler));

mePaymentsRouter.get(
  "/payment-orders",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await getOwnPaymentOrders(req.user!.id);
    res.json(data);
  })
);
