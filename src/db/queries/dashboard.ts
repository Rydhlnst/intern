import { db } from "@/db";
import {
  books,
  bookCopies,
  bookCategories,
  members,
  loans,
} from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { getBooks } from "./books";
import { getLoans, overduePredicate, activePredicate } from "./loans";

export async function getDashboardSummary() {
  const copyTalliesP = db
    .select({
      total: count(),
      available:
        sql<number>`count(*) filter (where ${bookCopies.status} = 'available')`,
      borrowed:
        sql<number>`count(*) filter (where ${bookCopies.status} = 'borrowed')`,
    })
    .from(bookCopies);

  const loanTalliesP = db
    .select({
      active: sql<number>`count(*) filter (where ${activePredicate})`,
      overdue: sql<number>`count(*) filter (where ${overduePredicate})`,
    })
    .from(loans);

  const [
    booksCount,
    copyTallies,
    categoriesCount,
    membersCount,
    loanTallies,
    latestBooks,
    latestLoans,
    overdueLoans,
  ] = await Promise.all([
    db.select({ c: count() }).from(books),
    copyTalliesP,
    db.select({ c: count() }).from(bookCategories),
    db.select({ c: count() }).from(members),
    loanTalliesP,
    getBooks({ limit: 5 }),
    getLoans({ limit: 5 }),
    getLoans({ overdue: true, limit: 5 }),
  ]);

  return {
    cards: {
      totalBooks: booksCount[0]?.c ?? 0,
      totalCopies: copyTallies[0]?.total ?? 0,
      availableCopies: copyTallies[0]?.available ?? 0,
      borrowedCopies: copyTallies[0]?.borrowed ?? 0,
      totalCategories: categoriesCount[0]?.c ?? 0,
      totalMembers: membersCount[0]?.c ?? 0,
      activeLoans: loanTallies[0]?.active ?? 0,
      overdueLoans: loanTallies[0]?.overdue ?? 0,
    },
    latestBooks: latestBooks.rows as Array<{
      id: number;
      title: string;
      author: string;
      categoryName: string;
      availableCopies: number;
    }>,
    latestLoans: latestLoans.rows,
    overdueLoans: overdueLoans.rows,
  };
}
