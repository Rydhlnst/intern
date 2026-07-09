import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  description: z.string().optional().or(z.literal("")),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
