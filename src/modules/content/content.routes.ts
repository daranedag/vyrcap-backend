import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { getPublicSiteContent, getPublishedBlocks } from "./content.service.js";

export const contentRouter = Router();

contentRouter.get(
  "/site",
  asyncHandler(async (_req, res) => {
    const data = await getPublicSiteContent();
    res.json(data);
  })
);

contentRouter.get(
  "/blocks",
  asyncHandler(async (_req, res) => {
    const data = await getPublishedBlocks();
    res.json(data);
  })
);
