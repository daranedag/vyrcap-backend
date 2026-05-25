import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/http.js";
import { loginSchema, signupSchema } from "./auth.schema.js";
import { login, logout, signup } from "./auth.service.js";

export const authRouter = Router();

const authRateLimit = createRateLimit({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "auth"
});

authRouter.post(
  "/signup",
  authRateLimit,
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid signup payload", "validation_error", parsed.error.flatten());
    }

    const data = await signup(parsed.data);
    res.status(201).json(data);
  })
);

authRouter.post(
  "/login",
  authRateLimit,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid login payload", "validation_error", parsed.error.flatten());
    }

    const data = await login(parsed.data);
    res.json(data);
  })
);

authRouter.post(
  "/logout",
  authRateLimit,
  asyncHandler(async (req, res) => {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const data = await logout(token);
    res.json(data);
  })
);
