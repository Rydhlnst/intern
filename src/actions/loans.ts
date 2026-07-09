"use server";

import { requirePermission } from "@/auth/guards";
import { db } from "@/db";
import { loans, members, bookCopies } from "@/db/schema";
import { loanSchema, returnLoanSchema } from "@/lib/validations/loan";
import {
  parseInput,
  actionError,
  actionOk,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";

type Input = FormData | Record<string, unknown>;

const today = () => new Date().toISOString().split("T")[0];

export async function createLoan(input: Input): Promise<ActionResult<number>> {
  const user = await requirePermission("create:loans");
  const parsed = parseInput(loanSchema, input);
  if (!parsed.success) return parsed.result;
  const d = parsed.data;

  try {
    const loanId = await db.transaction(async (tx) => {
      // Lock the member row and confirm they may borrow.
      const [member] = await tx
        .select({ status: members.status })
        .from(members)
        .where(eq(members.id, d.memberId))
        .for("update");
      if (!member) throw new BusinessError("Member not found.");
      if (member.status !== "active")
        throw new BusinessError("Only active members can borrow books.");

      // Lock the copy row and confirm it is available.
      const [copy] = await tx
        .select({ status: bookCopies.status })
        .from(bookCopies)
        .where(eq(bookCopies.id, d.bookCopyId))
        .for("update");
      if (!copy) throw new BusinessError("Book copy not found.");
      if (copy.status !== "available")
        throw new BusinessError("This book copy is not available.");

      // Belt-and-suspenders: reject if an unreturned loan already exists.
      const [openLoan] = await tx
        .select({ id: loans.id })
        .from(loans)
        .where(
          and(
            eq(loans.bookCopyId, d.bookCopyId),
            inArray(loans.status, ["borrowed", "overdue"])
          )
        )
        .limit(1);
      if (openLoan)
        throw new BusinessError("This copy already has an active loan.");

      const [row] = await tx
        .insert(loans)
        .values({
          memberId: d.memberId,
          bookCopyId: d.bookCopyId,
          borrowedAt: d.borrowedAt,
          dueDate: d.dueDate,
          status: "borrowed",
          notes: d.notes || null,
          createdBy: user.id,
        })
        .returning({ id: loans.id });

      await tx
        .update(bookCopies)
        .set({ status: "borrowed", updatedAt: new Date() })
        .where(eq(bookCopies.id, d.bookCopyId));

      return row.id;
    });

    revalidatePath("/loans");
    revalidatePath("/");
    return actionOk(loanId);
  } catch (err) {
    if (err instanceof BusinessError) return actionError(err.message);
    throw err;
  }
}

export async function returnLoan(
  loanId: number,
  input: Input
): Promise<ActionResult> {
  const user = await requirePermission("return:books");
  const parsed = parseInput(returnLoanSchema, input);
  if (!parsed.success) return parsed.result;
  const d = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [loan] = await tx
        .select({ status: loans.status, bookCopyId: loans.bookCopyId })
        .from(loans)
        .where(eq(loans.id, loanId))
        .for("update");
      if (!loan) throw new BusinessError("Loan not found.");
      if (loan.status === "returned")
        throw new BusinessError("This loan has already been returned.");

      await tx
        .update(loans)
        .set({
          status: "returned",
          returnedAt: d.returnedAt || today(),
          returnedBy: user.id,
          notes: d.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId));

      // Copy status follows the physical condition on return.
      await tx
        .update(bookCopies)
        .set({ status: d.returnCondition, updatedAt: new Date() })
        .where(eq(bookCopies.id, loan.bookCopyId));
    });

    revalidatePath("/loans");
    revalidatePath(`/loans/${loanId}`);
    revalidatePath("/");
    return actionOk();
  } catch (err) {
    if (err instanceof BusinessError) return actionError(err.message);
    throw err;
  }
}

export async function deleteLoan(id: number): Promise<ActionResult> {
  await requirePermission("delete:loans");

  await db.transaction(async (tx) => {
    const [loan] = await tx
      .select({ status: loans.status, bookCopyId: loans.bookCopyId })
      .from(loans)
      .where(eq(loans.id, id))
      .for("update");
    if (!loan) return;

    // Free the copy if the record being removed was still holding it.
    if (loan.status !== "returned") {
      await tx
        .update(bookCopies)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(bookCopies.id, loan.bookCopyId));
    }
    await tx.delete(loans).where(eq(loans.id, id));
  });

  revalidatePath("/loans");
  revalidatePath("/");
  return actionOk();
}

/** Thrown inside a transaction to trigger rollback with a user-facing message. */
class BusinessError extends Error {}
