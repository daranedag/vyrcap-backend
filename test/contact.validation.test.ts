import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/contact/contact.service.js", () => ({
  createContactMessage: vi.fn(async () => undefined)
}));

import app from "../src/app.js";
import { createContactMessage } from "../src/modules/contact/contact.service.js";

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid email", async () => {
    const response = await request(app).post("/api/contact").send({
      name: "Juan",
      email: "bad-email",
      message: "Mensaje válido con más de diez caracteres"
    });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("rejects message shorter than min length", async () => {
    const response = await request(app).post("/api/contact").send({
      name: "Juan",
      email: "juan@example.com",
      message: "corto"
    });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("accepts valid payload", async () => {
    const response = await request(app).post("/api/contact").send({
      name: "Juan",
      email: "juan@example.com",
      phone: "+56912345678",
      message: "Hola, necesito más información del curso."
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(createContactMessage).toHaveBeenCalledTimes(1);
  });
});
