import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/db/schema";
import { checkPermission, type Permission } from "./permissions";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user || user.status !== "active") {
    redirect("/login");
  }

  return user as User;
}

/**
 * Require an authenticated, active user AND a specific permission.
 * Redirects to /login if unauthenticated; throws "Forbidden" if the user's
 * role lacks the permission (server-side RBAC — never rely on hidden UI).
 * Use at the top of every mutating server action.
 */
export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireAuth();
  checkPermission(user.role, permission);
  return user;
}
