import { z } from "zod";
import { tiptapDocSchema } from "./book";

export const REVIEW_MAX_CHARS = 2000;

export const reviewSchema = z.object({
  bookId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  contentJson: tiptapDocSchema,
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
