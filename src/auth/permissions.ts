import type { User } from "@/db/schema";

export type Role = User["role"];
export type Permission =
  | "view:dashboard"
  | "manage:users"
  | "manage:roles"
  | "view:books"
  | "create:books"
  | "update:books"
  | "delete:books"
  | "upload:book_cover"
  | "manage:categories"
  | "manage:book_copies"
  | "view:members"
  | "create:members"
  | "update:members"
  | "delete:members"
  | "create:loans"
  | "return:books"
  | "delete:loans";

const permissionMatrix: Record<Permission, Role[]> = {
  "view:dashboard": ["super_admin", "librarian", "staff", "reader"],
  "manage:users": ["super_admin"],
  "manage:roles": ["super_admin"],
  "view:books": ["super_admin", "librarian", "staff", "reader"],
  "create:books": ["super_admin", "librarian"],
  "update:books": ["super_admin", "librarian"],
  "delete:books": ["super_admin", "librarian"],
  "upload:book_cover": ["super_admin", "librarian"],
  "manage:categories": ["super_admin", "librarian"],
  "manage:book_copies": ["super_admin", "librarian"],
  "view:members": ["super_admin", "librarian", "staff"],
  "create:members": ["super_admin", "librarian", "staff"],
  "update:members": ["super_admin", "librarian", "staff"],
  "delete:members": ["super_admin", "librarian"],
  "create:loans": ["super_admin", "librarian", "staff"],
  "return:books": ["super_admin", "librarian", "staff"],
  "delete:loans": ["super_admin"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionMatrix[permission].includes(role);
}

export function checkPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("Forbidden");
  }
}
