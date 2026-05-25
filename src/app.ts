import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsMiddleware } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { coursesRouter } from "./modules/courses/courses.routes.js";
import { enrollmentsRouter } from "./modules/enrollments/enrollments.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { mePaymentsRouter, paymentsRouter } from "./modules/payments/payments.routes.js";
import { profilesRouter } from "./modules/profiles/profiles.routes.js";
import { testimonialsRouter } from "./modules/testimonials/testimonials.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/health", healthRouter);
app.use("/api/content", contentRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/auth", authRouter);
app.use("/api/me", profilesRouter);
app.use("/api/me", enrollmentsRouter);
app.use("/api/me", mePaymentsRouter);
app.use("/api/payments", paymentsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
