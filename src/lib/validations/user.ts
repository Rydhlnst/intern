import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["super_admin", "librarian", "staff", "viewer"]),
  status: z.enum(["active", "inactive"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email"),
  role: z.enum(["super_admin", "librarian", "staff", "viewer"]),
  status: z.enum(["active", "inactive"]),
  password: z.string().min(8).optional().or(z.literal("")),
});

export const bookCopySchema = z.object({
  copyCode: z.string().min(1, "Copy code is required").max(100),
  status: z.enum(["available", "borrowed", "lost", "damaged", "archived"]),
  condition: z.enum(["good", "fair", "poor"]),
  shelfLocation: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type BookCopyFormData = z.infer<typeof bookCopySchema>;
