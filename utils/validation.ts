import { z } from 'zod';

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().regex(PHONE_REGEX, 'Enter a valid international number, e.g. +256 700 123 456'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  phone: z.string().trim().regex(PHONE_REGEX, 'Enter a valid international number, e.g. +256 700 123 456'),
  whatsapp: z.string().trim().regex(PHONE_REGEX, 'Enter a valid international number, e.g. +256 700 123 456'),
  bio: z.string().trim().max(120, 'Bio must be 120 characters or fewer'),
  email: z.string().trim().email('Enter a valid email address').optional().or(z.literal('')),
  title: z.string().trim().max(60, 'Title must be 60 characters or fewer').optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
