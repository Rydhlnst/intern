"use server";

import { requirePermission } from "@/auth/guards";
import { auth } from "@/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import {
  parseInput,
  actionError,
  actionOk,
  type ActionResult,
} from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

type Input = FormData | Record<string, unknown>;

export async function createUser(input: Input): Promise<ActionResult> {
  await requirePermission("manage:users");
  const parsed = parseInput(createUserSchema, input);
  if (!parsed.success) return parsed.result;
  const d = parsed.data;

  let userId: string;
  try {
    // Create the auth record (hashes the password, creates the account row).
    // No `headers` passed so this never touches the admin's own session.
    const res = await auth.api.signUpEmail({
      body: { name: d.name, email: d.email, password: d.password },
    });
    if (!res?.user?.id) return actionError("Failed to create user.");
    userId = res.user.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/exist/i.test(msg))
      return actionError("A user with this email already exists.");
    return actionError("Failed to create user.");
  }

  await db
    .update(users)
    .set({ role: d.role, status: d.status, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/users");
  return actionOk();
}

export async function updateUser(
  id: string,
  input: Input
): Promise<ActionResult> {
  await requirePermission("manage:users");
  const parsed = parseInput(updateUserSchema, input);
  if (!parsed.success) return parsed.result;
  const d = parsed.data;

  // Password changes require the Better Auth admin plugin (not enabled here),
  // so we intentionally manage only profile/role/status fields.
  await db
    .update(users)
    .set({
      name: d.name,
      email: d.email,
      role: d.role,
      status: d.status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  revalidatePath("/users");
  revalidatePath(`/users/${id}/edit`);
  return actionOk();
}

export async function deactivateUser(id: string): Promise<ActionResult> {
  const admin = await requirePermission("manage:users");
  if (admin.id === id) {
    return actionError("You cannot deactivate your own account.");
  }

  await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(users.id, id));

  revalidatePath("/users");
  return actionOk();
}
