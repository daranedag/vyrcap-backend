import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { getPublishedCourseBySlug, getPublishedCourses } from "./courses.service.js";

export const coursesRouter = Router();

coursesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await getPublishedCourses();
    res.json(data);
  })
);

coursesRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const slug = req.params["slug"];
    if (!slug) {
      res.status(400).json({ ok: false, error: { message: "Missing slug" } });
      return;
    }

    const data = await getPublishedCourseBySlug(slug);
    res.json(data);
  })
);
