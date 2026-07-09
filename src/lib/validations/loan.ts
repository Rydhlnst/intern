import { z } from "zod";

export const loanSchema = z
  .object({
    memberId: z.coerce.number().int().positive("Member is required"),
    bookCopyId: z.coerce.number().int().positive("Book copy is required"),
    borrowedAt: z.string().min(1, "Borrow date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.borrowedAt), {
    message: "Due date must be on or after borrow date",
    path: ["dueDate"],
  });

export type LoanFormData = z.infer<typeof loanSchema>;

/**
 * Return flow: the copy's resulting status depends on the physical condition
 * of the returned book (PRD 9.9). `returnedAt` defaults to today when omitted.
 */
export const returnLoanSchema = z.object({
  returnCondition: z.enum(["available", "damaged", "lost"]),
  returnedAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ReturnLoanFormData = z.infer<typeof returnLoanSchema>;
