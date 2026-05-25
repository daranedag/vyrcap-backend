import { z } from "zod";

export const createPreferenceSchema = z.object({
  courseId: z.string().uuid(),
  userId: z.string().optional()
});

export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>;
