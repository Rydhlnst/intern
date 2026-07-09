"use server";

import { requirePermission } from "@/auth/guards";
import { db } from "@/db";
import { members, loans } from "@/db/schema";
import { memberSchema } from "@/lib/validations/member";
import {
  parseInput,
  actionError,
  actionOk,
  isUniqueViolation,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { and, count, eq, inArray } from "drizzle-orm";

type Input = FormData | Record<string, unknown>;

export async function createMember(input: Input): Promise<ActionResult> {
  await requirePermission("create:members");
  const parsed = parseInput(memberSchema, input);
  if (!parsed.success) return parsed.result;

  const d = parsed.data;
  try {
    await db.insert(members).values({
      memberCode: d.memberCode,
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      status: d.status,
    });
  } catch (err) {
    if (isUniqueViolation(err))
      return actionError("A member with this code already exists.");
    throw err;
  }

  revalidatePath("/members");
  return actionOk();
}

export async function updateMember(
  id: number,
  input: Input
): Promise<ActionResult> {
  await requirePermission("update:members");
  const parsed = parseInput(memberSchema, input);
  if (!parsed.success) return parsed.result;

  const d = parsed.data;
  try {
    await db
      .update(members)
      .set({
        memberCode: d.memberCode,
        name: d.name,
        email: d.email || null,
        phone: d.phone || null,
        address: d.address || null,
        status: d.status,
        updatedAt: new Date(),
      })
      .where(eq(members.id, id));
  } catch (err) {
    if (isUniqueViolation(err))
      return actionError("A member with this code already exists.");
    throw err;
  }

  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  return actionOk();
}

export async function deleteMember(id: number): Promise<ActionResult> {
  await requirePermission("delete:members");

  // Guard referential integrity: block delete while the member has active loans.
  const [{ c: activeLoans }] = await db
    .select({ c: count() })
    .from(loans)
    .where(
      and(eq(loans.memberId, id), inArray(loans.status, ["borrowed", "overdue"]))
    );
  if (activeLoans > 0) {
    return actionError(
      "Cannot delete a member with active loans. Process their returns first."
    );
  }

  await db.delete(members).where(eq(members.id, id));
  revalidatePath("/members");
  return actionOk();
}
