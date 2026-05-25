import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError, toApiError } from "../utils/http.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const apiError = toApiError(error);
  const statusCode = apiError.statusCode || 500;
  const message = env.NODE_ENV === "production" && statusCode >= 500 ? "Internal server error" : apiError.message;

  const payload: Record<string, unknown> = {
    ok: false,
    error: {
      message
    }
  };

  if (apiError.code) {
    (payload["error"] as Record<string, unknown>)["code"] = apiError.code;
  }

  if (apiError.details && !(statusCode >= 500 && env.NODE_ENV === "production")) {
    (payload["error"] as Record<string, unknown>)["details"] = apiError.details;
  }

  if (error instanceof ApiError && apiError.statusCode >= 500) {
    console.error(error);
  }

  if (!(error instanceof ApiError) && statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(payload);
}
