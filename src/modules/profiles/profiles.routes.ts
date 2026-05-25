import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/http.js";
import { getOwnProfile, updateOwnProfile } from "./profiles.service.js";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  rut: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(40).optional(),
  metadata: z.record(z.unknown()).optional()
});

export const profilesRouter = Router();

profilesRouter.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const profile = await getOwnProfile(req.user!.id);
    res.json(profile);
  })
);

profilesRouter.put(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid profile payload", "validation_error", parsed.error.flatten());
    }

    const profile = await updateOwnProfile(req.user!.id, parsed.data);
    res.json(profile);
  })
);
