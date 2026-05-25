import cors from "cors";
import { env } from "./env.js";

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isWildcardEnabled = allowedOrigins.includes("*");

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || isWildcardEnabled || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin denied"));
  },
  credentials: true
});
