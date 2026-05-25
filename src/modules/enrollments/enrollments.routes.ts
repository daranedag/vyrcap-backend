import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getOwnEnrollments } from "./enrollments.service.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.get(
  "/enrollments",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await getOwnEnrollments(req.user!.id);
    res.json(data);
  })
);
