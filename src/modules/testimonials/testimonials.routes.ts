import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { getPublishedTestimonials } from "./testimonials.service.js";

export const testimonialsRouter = Router();

testimonialsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await getPublishedTestimonials();
    res.json(data);
  })
);
