import { db } from "@/db";
import { members, loans, bookCopies, books } from "@/db/schema";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getPagination, paginated } from "@/lib/pagination";

export type MemberFilters = {
  search?: string;
  status?: "active" | "inactive" | "suspended";
  page?: number | string;
  limit?: number | string;
};

function buildMemberWhere(filters: MemberFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (filters.search) {
    const term = `%${filters.search}%`;
    conds.push(
      or(
        ilike(members.name, term),
        ilike(members.memberCode, term),
        ilike(members.email, term)
      )
    );
  }
  if (filters.status) conds.push(eq(members.status, filters.status));
  return conds.length ? and(...conds) : undefined;
}

export async function getMembers(filters: MemberFilters = {}) {
  const { page, limit, offset } = getPagination(filters);
  const where = buildMemberWhere(filters);

  const [rows, totalRes] = await Promise.all([
    db
      .select()
      .from(members)
      .where(where)
      .orderBy(desc(members.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ c: count() }).from(members).where(where),
  ]);

  return paginated(rows, totalRes[0]?.c ?? 0, { page, limit, offset });
}

export async function getMemberById(id: number) {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, id))
    .limit(1);
  if (!member) return null;

  const loanHistory = await db
    .select({
      id: loans.id,
      status: loans.status,
      borrowedAt: loans.borrowedAt,
      dueDate: loans.dueDate,
      returnedAt: loans.returnedAt,
      copyCode: bookCopies.copyCode,
      bookTitle: books.title,
    })
    .from(loans)
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .where(eq(loans.memberId, id))
    .orderBy(desc(loans.createdAt));

  return { ...member, loanHistory };
}
