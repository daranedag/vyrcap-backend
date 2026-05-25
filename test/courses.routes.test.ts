import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const mockCourseRow = {
  id: "58c3b6df-0a0e-4d16-a785-50d7d6d7f9a2",
  slug: "curso-prueba",
  title: "Curso Prueba",
  short_description: "Resumen",
  description: "Descripcion",
  objective: "Objetivo",
  contents: ["Modulo 1"],
  audience: "Publico",
  modality: "online",
  price_clp: 150000,
  duration_hours: 40,
  thumbnail_url: "https://example.com/thumb.jpg",
  moodle_course_url: "https://moodle.example.com/course/1",
  status: "published",
  display_order: 1,
  metadata: {}
};

vi.mock("../src/lib/insforge.js", () => ({
  getInsforgePublicClient: () => ({
    from: (table: string) => {
      if (table !== "courses") {
        throw new Error("Unexpected table");
      }

      return {
        select: () => ({
          eq: () => ({
            order: async () => ({
              data: [mockCourseRow],
              error: null
            })
          })
        })
      };
    }
  })
}));

import app from "../src/app.js";

describe("GET /api/courses", () => {
  it("maps snake_case to camelCase for frontend compatibility", async () => {
    const response = await request(app).get("/api/courses");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      shortDescription: "Resumen",
      priceClp: 150000,
      durationHours: 40,
      moodleCourseUrl: "https://moodle.example.com/course/1"
    });
  });
});
