import { z } from "zod";

export const memberSchema = z.object({
  memberCode: z.string().min(1, "Member code is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended"]),
});

export type MemberFormData = z.infer<typeof memberSchema>;
