import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(40).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(128)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
