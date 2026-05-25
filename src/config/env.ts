import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  INSFORGE_URL: z.string().url().default("http://localhost:54321"),
  INSFORGE_ANON_KEY: z.string().min(1).default("anon-key"),
  INSFORGE_SERVICE_KEY: z.string().min(1).default("service-key"),
  PUBLIC_SITE_URL: z.string().url().default("http://localhost:5173"),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1).default("test-token"),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_URL: z.string().url().default("http://localhost:4000/api/payments/mercadopago/webhook"),
  MOODLE_BASE_URL: z.string().url().optional(),
  MOODLE_TOKEN: z.string().optional(),
  MOODLE_SERVICE: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;
