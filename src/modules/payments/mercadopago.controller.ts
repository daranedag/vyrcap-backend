import type { Request, Response } from "express";
import { handleMercadoPagoWebhook } from "./payments.service.js";

function extractPaymentId(req: Request): string | null {
  const fromQuery = req.query["id"] ?? req.query["data.id"];
  if (typeof fromQuery === "string" && fromQuery.trim().length > 0) {
    return fromQuery;
  }

  const body = req.body as Record<string, any> | undefined;
  const fromBody = body?.["data"]?.["id"] ?? body?.["id"];
  if (typeof fromBody === "string" || typeof fromBody === "number") {
    return String(fromBody);
  }

  return null;
}

export async function mercadoPagoWebhookHandler(req: Request, res: Response) {
  const paymentId = extractPaymentId(req);

  if (!paymentId) {
    res.json({ ok: true });
    return;
  }

  try {
    await handleMercadoPagoWebhook(paymentId);
  } catch (error) {
    console.error("Mercado Pago webhook processing error:", error);
  }

  res.json({ ok: true });
}
