import { z } from "zod";

export const tiptapDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.any()).optional(),
});

function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}

export const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  author: z.string().min(1, "Author is required").max(255),
  isbn: z.string().max(50).optional().or(z.literal("")),
  publicationDate: z.string().min(1, "Publication date is required"),
  publisher: z.string().min(1, "Publisher is required").max(255),
  numberOfPages: z.coerce.number().int().min(1, "Must be at least 1 page"),
  categoryId: z.coerce.number().int().positive("Category is required"),
  description: z.preprocess(parseMaybeJson, tiptapDocSchema.nullable().optional()),
});

export type BookFormData = z.infer<typeof bookSchema>;
