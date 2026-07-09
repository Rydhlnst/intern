import { db } from "@/db";
import { loans, members, bookCopies, books, users } from "@/db/schema";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getPagination, paginated } from "@/lib/pagination";

const returner = alias(users, "returner");

export type LoanFilters = {
  search?: string; // member name / code
  status?: "borrowed" | "returned" | "overdue";
  overdue?: boolean;
  page?: number | string;
  limit?: number | string;
};

// A loan counts as overdue when it's marked overdue OR still out past its due
// date — union of the stored status and a derived check (no cron needed).
export const overduePredicate = sql`(${loans.status} = 'overdue' or (${loans.status} = 'borrowed' and ${loans.dueDate} < CURRENT_DATE))`;

// A loan is "active" (not returned) when it's borrowed or overdue.
export const activePredicate = sql`${loans.status} in ('borrowed', 'overdue')`;

function buildLoanWhere(filters: LoanFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (filters.search) {
    const term = `%${filters.search}%`;
    conds.push(or(ilike(members.name, term), ilike(members.memberCode, term)));
  }
  if (filters.status) conds.push(eq(loans.status, filters.status));
  if (filters.overdue) conds.push(overduePredicate);
  return conds.length ? and(...conds) : undefined;
}

const loanColumns = {
  id: loans.id,
  status: loans.status,
  borrowedAt: loans.borrowedAt,
  dueDate: loans.dueDate,
  returnedAt: loans.returnedAt,
  notes: loans.notes,
  createdAt: loans.createdAt,
  isOverdue: sql<boolean>`(${overduePredicate})`,
  memberId: members.id,
  memberName: members.name,
  memberCode: members.memberCode,
  bookCopyId: bookCopies.id,
  copyCode: bookCopies.copyCode,
  bookId: books.id,
  bookTitle: books.title,
  createdByName: users.name,
};

export async function getLoans(filters: LoanFilters = {}) {
  const { page, limit, offset } = getPagination(filters);
  const where = buildLoanWhere(filters);

  const [rows, totalRes] = await Promise.all([
    db
      .select(loanColumns)
      .from(loans)
      .innerJoin(members, eq(loans.memberId, members.id))
      .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
      .innerJoin(books, eq(bookCopies.bookId, books.id))
      .innerJoin(users, eq(loans.createdBy, users.id))
      .where(where)
      .orderBy(desc(loans.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ c: count() })
      .from(loans)
      .innerJoin(members, eq(loans.memberId, members.id))
      .where(where),
  ]);

  return paginated(rows, totalRes[0]?.c ?? 0, { page, limit, offset });
}

export async function getLoanById(id: number) {
  const [loan] = await db
    .select({
      ...loanColumns,
      returnedByName: returner.name,
    })
    .from(loans)
    .innerJoin(members, eq(loans.memberId, members.id))
    .innerJoin(bookCopies, eq(loans.bookCopyId, bookCopies.id))
    .innerJoin(books, eq(bookCopies.bookId, books.id))
    .innerJoin(users, eq(loans.createdBy, users.id))
    .leftJoin(returner, eq(returner.id, loans.returnedBy))
    .where(eq(loans.id, id))
    .limit(1);
  return loan ?? null;
}
