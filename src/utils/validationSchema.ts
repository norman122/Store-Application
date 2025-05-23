import { z } from 'zod';

// Signup form validation schema
export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'),
});

// Login form validation schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// OTP verification schema
export const verificationSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only numbers'),
});

// Product validation schema
export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters long').max(1000, 'Description cannot exceed 1000 characters'),
  price: z.number().min(0, 'Price cannot be negative'),
  location: z.object({
    name: z.string().min(1, 'Location name is required'),
    latitude: z.number(),
    longitude: z.number(),
  }),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters long'),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Define types based on schemas
export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type VerificationFormData = z.infer<typeof verificationSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>; 