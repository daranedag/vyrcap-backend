import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/http.js";
import { contactSchema } from "./contact.schema.js";
import { createContactMessage } from "./contact.service.js";

export const contactRouter = Router();

const contactRateLimit = createRateLimit({
  windowMs: 60_000,
  max: 10,
  keyPrefix: "contact"
});

contactRouter.post(
  "/",
  contactRateLimit,
  asyncHandler(async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid contact payload", "validation_error", parsed.error.flatten());
    }

    await createContactMessage(parsed.data);
    res.json({ ok: true });
  })
);
