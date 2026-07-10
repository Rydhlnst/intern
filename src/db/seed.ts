import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { auth } from "../auth/config";
import type { TiptapDoc } from "../lib/tiptap/types";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: schema.User["role"];
};

type SeedCategory = {
  name: string;
  description: string;
};

type SeedBook = {
  title: string;
  author: string;
  isbn: string;
  publicationDate: string;
  publisher: string;
  numberOfPages: number;
  category: string;
  description: string;
};

type SeedMember = {
  memberCode: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: typeof schema.memberStatusEnum.enumValues[number];
};

type SeedLoan = {
  memberCode: string;
  title: string;
  copyNumber: number;
  borrowedAt: string;
  dueDate: string;
  status: typeof schema.loanStatusEnum.enumValues[number];
  returnedAt?: string;
};

const seedUsers: SeedUser[] = [
  {
    name: "Super Admin",
    email: "admin@example.com",
    password: "password",
    role: "super_admin",
  },
  {
    name: "Librarian",
    email: "librarian@example.com",
    password: "password",
    role: "librarian",
  },
  {
    name: "Staff",
    email: "staff@example.com",
    password: "password",
    role: "staff",
  },
  {
    name: "Reader",
    email: "reader@example.com",
    password: "password",
    role: "reader",
  },
];

const categoryData: SeedCategory[] = [
  {
    name: "Business",
    description: "Strategy, entrepreneurship, product thinking, and company building.",
  },
  {
    name: "Technology",
    description: "Software engineering, systems thinking, and technical execution.",
  },
  {
    name: "Design",
    description: "Visual thinking, product design, and creative process references.",
  },
  {
    name: "Self Improvement",
    description: "Habits, psychology, focus, and personal growth.",
  },
  {
    name: "Money/Investing",
    description: "Money mindset, investing, and long-horizon decision making.",
  },
  {
    name: "Fiction",
    description: "Novels and literary fiction for general readers.",
  },
  {
    name: "History",
    description: "Historical narratives, biography, and big-picture context.",
  },
  {
    name: "Science",
    description: "Science, discovery, and the mechanics of the natural world.",
  },
];

const booksData: SeedBook[] = [
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    isbn: "9780857197689",
    publicationDate: "2020-09-08",
    publisher: "Harriman House",
    numberOfPages: 256,
    category: "Money/Investing",
    description: "Timeless lessons about wealth, behavior, and long-term thinking.",
  },
  {
    title: "Company of One",
    author: "Paul Jarvis",
    isbn: "9781328972378",
    publicationDate: "2019-01-15",
    publisher: "Mariner Books",
    numberOfPages: 272,
    category: "Business",
    description: "A case for staying small, resilient, and intentionally focused.",
  },
  {
    title: "How Innovation Works",
    author: "Matt Ridley",
    isbn: "9780062916594",
    publicationDate: "2020-05-19",
    publisher: "Harper",
    numberOfPages: 400,
    category: "Business",
    description: "Innovation as a messy but repeatable engine of progress.",
  },
  {
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    isbn: "9780141439570",
    publicationDate: "1891-04-01",
    publisher: "Penguin Classics",
    numberOfPages: 272,
    category: "Fiction",
    description: "Vanity, corruption, and the cost of preserving appearances.",
  },
  {
    title: "The Two Towers",
    author: "J. R. R. Tolkien",
    isbn: "9780261102361",
    publicationDate: "1954-11-11",
    publisher: "George Allen & Unwin",
    numberOfPages: 352,
    category: "Fiction",
    description: "The fellowship fractures while the war for Middle-earth escalates.",
  },
  {
    title: "Steal Like an Artist",
    author: "Austin Kleon",
    isbn: "9780761169253",
    publicationDate: "2012-02-28",
    publisher: "Workman Publishing",
    numberOfPages: 160,
    category: "Design",
    description: "A practical manifesto for creative work built from influence and iteration.",
  },
  {
    title: "Show Your Work!",
    author: "Austin Kleon",
    isbn: "9780761178972",
    publicationDate: "2014-03-06",
    publisher: "Workman Publishing",
    numberOfPages: 224,
    category: "Design",
    description: "How to share process publicly without turning it into noise.",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    publicationDate: "2018-10-16",
    publisher: "Avery",
    numberOfPages: 320,
    category: "Self Improvement",
    description: "A system for building durable behavior change from tiny repeated actions.",
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    isbn: "9781455586691",
    publicationDate: "2016-01-05",
    publisher: "Grand Central Publishing",
    numberOfPages: 304,
    category: "Self Improvement",
    description: "A defense of focused work in an increasingly distracted world.",
  },
  {
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    isbn: "9780062457714",
    publicationDate: "2016-09-13",
    publisher: "HarperOne",
    numberOfPages: 224,
    category: "Self Improvement",
    description: "A blunt argument for selective care, priorities, and emotional honesty.",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    publicationDate: "2008-08-01",
    publisher: "Prentice Hall",
    numberOfPages: 464,
    category: "Technology",
    description: "A foundational handbook on readable, maintainable software craftsmanship.",
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt and David Thomas",
    isbn: "9780135957059",
    publicationDate: "2019-09-13",
    publisher: "Addison-Wesley",
    numberOfPages: 352,
    category: "Technology",
    description: "A field guide for developers building better habits and better systems.",
  },
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "9781449373320",
    publicationDate: "2017-03-16",
    publisher: "O'Reilly Media",
    numberOfPages: 616,
    category: "Technology",
    description: "How modern data systems are built for reliability, scale, and change.",
  },
  {
    title: "Refactoring UI",
    author: "Adam Wathan and Steve Schoger",
    isbn: "9780000000001",
    publicationDate: "2018-11-14",
    publisher: "Refactoring UI",
    numberOfPages: 248,
    category: "Design",
    description: "Concrete interface design heuristics for sharper product polish.",
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    isbn: "9780804139298",
    publicationDate: "2014-09-16",
    publisher: "Crown Business",
    numberOfPages: 224,
    category: "Business",
    description: "A contrarian startup lens on creating new value instead of copying old markets.",
  },
  {
    title: "Good to Great",
    author: "Jim Collins",
    isbn: "9780066620992",
    publicationDate: "2001-10-16",
    publisher: "HarperBusiness",
    numberOfPages: 320,
    category: "Business",
    description: "A study of companies that crossed from average performance into durable excellence.",
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    isbn: "9781612681139",
    publicationDate: "2017-04-11",
    publisher: "Plata Publishing",
    numberOfPages: 336,
    category: "Money/Investing",
    description: "Personal finance framed around assets, mindset, and ownership.",
  },
  {
    title: "A Random Walk Down Wall Street",
    author: "Burton G. Malkiel",
    isbn: "9781324035435",
    publicationDate: "2023-01-03",
    publisher: "W. W. Norton & Company",
    numberOfPages: 480,
    category: "Money/Investing",
    description: "An accessible investing guide centered on markets, behavior, and diversification.",
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    publicationDate: "2015-02-10",
    publisher: "Harper",
    numberOfPages: 464,
    category: "History",
    description: "A sweeping history of humanity through cognition, agriculture, and empire.",
  },
  {
    title: "The Lessons of History",
    author: "Will Durant and Ariel Durant",
    isbn: "9781439149959",
    publicationDate: "2010-08-03",
    publisher: "Simon & Schuster",
    numberOfPages: 128,
    category: "History",
    description: "A compressed synthesis of recurring patterns across civilizations.",
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    isbn: "9780553380163",
    publicationDate: "1998-09-01",
    publisher: "Bantam",
    numberOfPages: 224,
    category: "Science",
    description: "A compact introduction to cosmology, black holes, and the universe.",
  },
  {
    title: "Cosmos",
    author: "Carl Sagan",
    isbn: "9780345539434",
    publicationDate: "2013-12-10",
    publisher: "Ballantine Books",
    numberOfPages: 432,
    category: "Science",
    description: "Science communication at full scale, from planets to human curiosity.",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    isbn: "9780374533557",
    publicationDate: "2013-04-02",
    publisher: "Farrar, Straus and Giroux",
    numberOfPages: 512,
    category: "Science",
    description: "The cognitive systems behind judgment, bias, and decision making.",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441172719",
    publicationDate: "1990-09-01",
    publisher: "Ace",
    numberOfPages: 896,
    category: "Fiction",
    description: "Power, prophecy, ecology, and survival on Arrakis.",
  },
];

const membersData: SeedMember[] = [
  {
    memberCode: "MBR001",
    name: "Ahmad Fauzi",
    email: "ahmad@example.com",
    phone: "081234567890",
    address: "Jakarta Selatan",
    status: "active",
  },
  {
    memberCode: "MBR002",
    name: "Siti Rahayu",
    email: "siti@example.com",
    phone: "081234567891",
    address: "Bandung",
    status: "active",
  },
  {
    memberCode: "MBR003",
    name: "Budi Santoso",
    email: "budi@example.com",
    phone: "081234567892",
    address: "Surabaya",
    status: "active",
  },
  {
    memberCode: "MBR004",
    name: "Dewi Kusuma",
    email: "dewi@example.com",
    phone: "081234567893",
    address: "Yogyakarta",
    status: "active",
  },
  {
    memberCode: "MBR005",
    name: "Eko Prasetyo",
    email: "eko@example.com",
    phone: "081234567894",
    address: "Semarang",
    status: "active",
  },
  {
    memberCode: "MBR006",
    name: "Fitri Handayani",
    email: "fitri@example.com",
    phone: "081234567895",
    address: "Bogor",
    status: "active",
  },
  {
    memberCode: "MBR007",
    name: "Galih Wicaksono",
    email: "galih@example.com",
    phone: "081234567896",
    address: "Depok",
    status: "inactive",
  },
  {
    memberCode: "MBR008",
    name: "Hani Pertiwi",
    email: "hani@example.com",
    phone: "081234567897",
    address: "Bekasi",
    status: "active",
  },
  {
    memberCode: "MBR009",
    name: "Irfan Maulana",
    email: "irfan@example.com",
    phone: "081234567898",
    address: "Tangerang",
    status: "suspended",
  },
  {
    memberCode: "MBR010",
    name: "Joko Saputra",
    email: "joko@example.com",
    phone: "081234567899",
    address: "Malang",
    status: "active",
  },
  {
    memberCode: "MBR011",
    name: "Kirana Putri",
    email: "kirana@example.com",
    phone: "081234567880",
    address: "Solo",
    status: "active",
  },
  {
    memberCode: "MBR012",
    name: "Luthfi Ramadhan",
    email: "luthfi@example.com",
    phone: "081234567881",
    address: "Makassar",
    status: "active",
  },
];

function toTiptapDoc(text: string): TiptapDoc {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

function formatDateOffset(daysOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

function buildBookCopies(insertedBooks: Array<typeof schema.books.$inferSelect>) {
  const copyRows: Array<typeof schema.bookCopies.$inferInsert> = [];

  insertedBooks.forEach((book, index) => {
    const totalCopies = index < 8 ? 3 : index < 18 ? 2 : 1;

    for (let copyIndex = 0; copyIndex < totalCopies; copyIndex += 1) {
      copyRows.push({
        bookId: book.id,
        copyCode: `BK${book.id.toString().padStart(3, "0")}-C${(copyIndex + 1)
          .toString()
          .padStart(2, "0")}`,
        status: "available",
        condition: copyIndex === totalCopies - 1 && totalCopies > 2 ? "fair" : "good",
        shelfLocation: `Shelf ${String.fromCharCode(65 + (index % 6))}-${(index % 4) + 1}`,
      });
    }
  });

  return copyRows;
}

async function ensureUser(seedUser: SeedUser) {
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, seedUser.email),
  });

  if (existingUser) {
    await db
      .update(schema.users)
      .set({
        name: seedUser.name,
        role: seedUser.role,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existingUser.id));

    return existingUser.id;
  }

  const result = await auth.api.signUpEmail({
    body: {
      name: seedUser.name,
      email: seedUser.email,
      password: seedUser.password,
    },
  });

  if (!result?.user?.id) {
    throw new Error(`Failed to create user: ${seedUser.email}`);
  }

  await db
    .update(schema.users)
    .set({ role: seedUser.role, status: "active", updatedAt: new Date() })
    .where(eq(schema.users.id, result.user.id));

  return result.user.id;
}

async function syncBooks(categoryIdByName: Map<string, number>) {
  const existingBooks = await db
    .select()
    .from(schema.books)
    .where(inArray(schema.books.isbn, booksData.map((book) => book.isbn)));

  const existingByIsbn = new Map(existingBooks.map((book) => [book.isbn, book]));
  const syncedBooks: Array<typeof schema.books.$inferSelect> = [];

  for (const book of booksData) {
    const payload = {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publicationDate: book.publicationDate,
      publisher: book.publisher,
      numberOfPages: book.numberOfPages,
      categoryId: categoryIdByName.get(book.category)!,
      description: toTiptapDoc(book.description),
      updatedAt: new Date(),
    };

    const existing = existingByIsbn.get(book.isbn);

    if (existing) {
      const [updated] = await db
        .update(schema.books)
        .set(payload)
        .where(eq(schema.books.id, existing.id))
        .returning();
      syncedBooks.push(updated);
      continue;
    }

    const [created] = await db
      .insert(schema.books)
      .values(payload)
      .returning();
    syncedBooks.push(created);
  }

  return syncedBooks;
}

async function syncBookCopies(insertedBooks: Array<typeof schema.books.$inferSelect>) {
  const copyRows = buildBookCopies(insertedBooks);
  const existingCopies = await db
    .select()
    .from(schema.bookCopies)
    .where(inArray(schema.bookCopies.copyCode, copyRows.map((copy) => copy.copyCode)));
  const existingByCode = new Map(existingCopies.map((copy) => [copy.copyCode, copy]));
  const syncedCopies: Array<typeof schema.bookCopies.$inferSelect> = [];

  for (const copy of copyRows) {
    const payload = {
      bookId: copy.bookId,
      copyCode: copy.copyCode,
      status: copy.status,
      condition: copy.condition,
      shelfLocation: copy.shelfLocation,
      updatedAt: new Date(),
    };

    const existing = existingByCode.get(copy.copyCode);

    if (existing) {
      const [updated] = await db
        .update(schema.bookCopies)
        .set(payload)
        .where(eq(schema.bookCopies.id, existing.id))
        .returning();
      syncedCopies.push(updated);
      continue;
    }

    const [created] = await db
      .insert(schema.bookCopies)
      .values(payload)
      .returning();
    syncedCopies.push(created);
  }

  return syncedCopies;
}

async function syncLoan(
  loan: SeedLoan,
  membersByCode: Map<string, typeof schema.members.$inferSelect>,
  copiesByCode: Map<string, typeof schema.bookCopies.$inferSelect>,
  adminUserId: string
) {
  const member = membersByCode.get(loan.memberCode);
  const copy = copiesByCode.get(`${loan.title}::${loan.copyNumber}`);

  if (!member || !copy) {
    throw new Error(`Missing seed references for loan: ${loan.memberCode} / ${loan.title}`);
  }

  const existingLoan = await db.query.loans.findFirst({
    where: eq(schema.loans.bookCopyId, copy.id),
  });

  await db
    .update(schema.bookCopies)
    .set({
      status: loan.status === "returned" ? "available" : "borrowed",
      updatedAt: new Date(),
    })
    .where(eq(schema.bookCopies.id, copy.id));

  const payload = {
    memberId: member.id,
    bookCopyId: copy.id,
    borrowedAt: loan.borrowedAt,
    dueDate: loan.dueDate,
    returnedAt: loan.returnedAt ?? null,
    status: loan.status,
    createdBy: adminUserId,
    returnedBy: loan.status === "returned" ? adminUserId : null,
    updatedAt: new Date(),
  };

  if (existingLoan) {
    await db.update(schema.loans).set(payload).where(eq(schema.loans.id, existingLoan.id));
    return;
  }

  await db.insert(schema.loans).values(payload);
}

async function main() {
  console.log("Seeding database...");

  console.log("Ensuring auth users...");
  const userIds = new Map<string, string>();
  for (const seedUser of seedUsers) {
    const userId = await ensureUser(seedUser);
    userIds.set(seedUser.email, userId);
  }

  const adminUserId = userIds.get("admin@example.com");
  const readerUserId = userIds.get("reader@example.com");
  const librarianUserId = userIds.get("librarian@example.com");
  const staffUserId = userIds.get("staff@example.com");

  if (!adminUserId || !readerUserId || !librarianUserId || !staffUserId) {
    throw new Error("Required seed users were not created correctly.");
  }

  console.log("Syncing categories...");
  const insertedCategories = await db
    .insert(schema.bookCategories)
    .values(categoryData)
    .onConflictDoUpdate({
      target: schema.bookCategories.name,
      set: {
        description: undefined,
        updatedAt: new Date(),
      },
    })
    .returning();

  for (const category of categoryData) {
    await db
      .update(schema.bookCategories)
      .set({ description: category.description, updatedAt: new Date() })
      .where(eq(schema.bookCategories.name, category.name));
  }

  const categories = insertedCategories.length > 0
    ? await db.select().from(schema.bookCategories).where(inArray(schema.bookCategories.name, categoryData.map((category) => category.name)))
    : await db.select().from(schema.bookCategories).where(inArray(schema.bookCategories.name, categoryData.map((category) => category.name)));

  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));

  console.log("Syncing books...");
  const books = await syncBooks(categoryIdByName);
  const bookByTitle = new Map(books.map((book) => [book.title, book]));

  console.log("Syncing book copies...");
  const copies = await syncBookCopies(books);
  const copiesByBookId = new Map<number, Array<typeof schema.bookCopies.$inferSelect>>();
  for (const copy of copies) {
    const group = copiesByBookId.get(copy.bookId) ?? [];
    group.push(copy);
    copiesByBookId.set(copy.bookId, group);
  }

  const copyLookup = new Map<string, typeof schema.bookCopies.$inferSelect>();
  for (const [title, book] of bookByTitle.entries()) {
    const relatedCopies = copiesByBookId.get(book.id) ?? [];
    relatedCopies
      .sort((left, right) => left.copyCode.localeCompare(right.copyCode))
      .forEach((copy, index) => {
        copyLookup.set(`${title}::${index + 1}`, copy);
      });
  }

  console.log("Syncing members...");
  await db
    .insert(schema.members)
    .values(membersData)
    .onConflictDoUpdate({
      target: schema.members.memberCode,
      set: {
        name: undefined,
        email: undefined,
        phone: undefined,
        address: undefined,
        status: undefined,
        updatedAt: new Date(),
      },
    });

  for (const member of membersData) {
    await db
      .update(schema.members)
      .set({
        name: member.name,
        email: member.email,
        phone: member.phone,
        address: member.address,
        status: member.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.members.memberCode, member.memberCode));
  }

  const members = await db
    .select()
    .from(schema.members)
    .where(inArray(schema.members.memberCode, membersData.map((member) => member.memberCode)));
  const membersByCode = new Map(members.map((member) => [member.memberCode, member]));

  console.log("Syncing email preferences...");
  await db
    .insert(schema.userEmailPreferences)
    .values([
      {
        userId: adminUserId,
        authEmailsEnabled: true,
        readerNotificationsEnabled: true,
        operationalEmailsEnabled: true,
        marketingEmailsEnabled: false,
      },
      {
        userId: librarianUserId,
        authEmailsEnabled: true,
        readerNotificationsEnabled: true,
        operationalEmailsEnabled: true,
        marketingEmailsEnabled: false,
      },
      {
        userId: staffUserId,
        authEmailsEnabled: true,
        readerNotificationsEnabled: false,
        operationalEmailsEnabled: true,
        marketingEmailsEnabled: false,
      },
      {
        userId: readerUserId,
        authEmailsEnabled: true,
        readerNotificationsEnabled: true,
        operationalEmailsEnabled: true,
        marketingEmailsEnabled: false,
      },
    ])
    .onConflictDoUpdate({
      target: schema.userEmailPreferences.userId,
      set: {
        authEmailsEnabled: true,
        readerNotificationsEnabled: true,
        operationalEmailsEnabled: true,
        marketingEmailsEnabled: false,
        updatedAt: new Date(),
      },
    });

  console.log("Syncing loans...");
  const seedLoans: SeedLoan[] = [
    {
      memberCode: "MBR001",
      title: "The Psychology of Money",
      copyNumber: 1,
      borrowedAt: formatDateOffset(-5),
      dueDate: formatDateOffset(9),
      status: "borrowed",
    },
    {
      memberCode: "MBR002",
      title: "Company of One",
      copyNumber: 1,
      borrowedAt: formatDateOffset(-3),
      dueDate: formatDateOffset(11),
      status: "borrowed",
    },
    {
      memberCode: "MBR003",
      title: "Atomic Habits",
      copyNumber: 1,
      borrowedAt: formatDateOffset(-7),
      dueDate: formatDateOffset(4),
      status: "borrowed",
    },
    {
      memberCode: "MBR004",
      title: "Clean Code",
      copyNumber: 1,
      borrowedAt: formatDateOffset(-18),
      dueDate: formatDateOffset(-4),
      status: "overdue",
    },
    {
      memberCode: "MBR005",
      title: "Sapiens",
      copyNumber: 1,
      borrowedAt: formatDateOffset(-21),
      dueDate: formatDateOffset(-8),
      status: "overdue",
    },
    {
      memberCode: "MBR006",
      title: "Dune",
      copyNumber: 1,
      borrowedAt: formatDateOffset(-24),
      dueDate: formatDateOffset(-10),
      returnedAt: formatDateOffset(-12),
      status: "returned",
    },
  ];

  for (const loan of seedLoans) {
    await syncLoan(loan, membersByCode, copyLookup, adminUserId);
  }

  console.log("Syncing reader collections...");
  await db
    .insert(schema.readerBookmarks)
    .values([
      { userId: readerUserId, bookId: bookByTitle.get("The Psychology of Money")!.id },
      { userId: readerUserId, bookId: bookByTitle.get("Sapiens")!.id },
      { userId: readerUserId, bookId: bookByTitle.get("Refactoring UI")!.id },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.readerFavorites)
    .values([
      { userId: readerUserId, bookId: bookByTitle.get("Atomic Habits")!.id },
      { userId: readerUserId, bookId: bookByTitle.get("Company of One")!.id },
      { userId: readerUserId, bookId: bookByTitle.get("Dune")!.id },
    ])
    .onConflictDoNothing();

  const historySeeds = [
    {
      userId: readerUserId,
      bookId: bookByTitle.get("The Psychology of Money")!.id,
      action: "viewed",
      query: null,
    },
    {
      userId: readerUserId,
      bookId: bookByTitle.get("Atomic Habits")!.id,
      action: "favorited",
      query: null,
    },
    {
      userId: readerUserId,
      bookId: bookByTitle.get("Company of One")!.id,
      action: "bookmarked",
      query: null,
    },
    {
      userId: readerUserId,
      bookId: null,
      action: "searched",
      query: "business strategy books",
    },
    {
      userId: readerUserId,
      bookId: null,
      action: "searched",
      query: "money investing beginner",
    },
  ];

  const existingHistory = await db
    .select()
    .from(schema.readerHistory)
    .where(eq(schema.readerHistory.userId, readerUserId));
  const historyKeys = new Set(
    existingHistory.map((item) => `${item.userId}|${item.bookId ?? "none"}|${item.action}|${item.query ?? ""}`)
  );

  const newHistory = historySeeds.filter(
    (item) =>
      !historyKeys.has(
        `${item.userId}|${item.bookId ?? "none"}|${item.action}|${item.query ?? ""}`
      )
  );

  if (newHistory.length > 0) {
    await db.insert(schema.readerHistory).values(newHistory);
  }

  console.log("Syncing email planning events...");
  const emailSeedEvents = [
    {
      userId: readerUserId,
      recipientEmail: "reader@example.com",
      templateKey: "reader_overdue_reminder" as const,
      triggerSource: "reader" as const,
      subject: "Overdue reminder readiness",
      payload: {
        memberCode: "MBR004",
        loanCount: 2,
        trigger: "seed-readiness",
      },
      status: "planned" as const,
    },
    {
      userId: adminUserId,
      recipientEmail: "admin@example.com",
      templateKey: "system_announcement" as const,
      triggerSource: "system" as const,
      subject: "Library announcement pipeline readiness",
      payload: {
        audience: "staff-and-readers",
        trigger: "seed-readiness",
      },
      status: "planned" as const,
    },
    {
      userId: readerUserId,
      recipientEmail: "reader@example.com",
      templateKey: "auth_welcome" as const,
      triggerSource: "auth" as const,
      subject: "Welcome email readiness",
      payload: {
        userRole: "reader",
        trigger: "seed-readiness",
      },
      status: "planned" as const,
    },
  ];

  const existingEvents = await db
    .select()
    .from(schema.emailEvents)
    .where(
      and(
        inArray(
          schema.emailEvents.subject,
          emailSeedEvents.map((event) => event.subject)
        ),
        inArray(
          schema.emailEvents.recipientEmail,
          emailSeedEvents.map((event) => event.recipientEmail)
        )
      )
    );
  const existingEventKeys = new Set(
    existingEvents.map((event) => `${event.recipientEmail}|${event.templateKey}|${event.subject}`)
  );

  const newEvents = emailSeedEvents.filter(
    (event) =>
      !existingEventKeys.has(
        `${event.recipientEmail}|${event.templateKey}|${event.subject}`
      )
  );

  if (newEvents.length > 0) {
    await db.insert(schema.emailEvents).values(newEvents);
  }

  console.log(
    `Seed sync complete: ${categoryData.length} categories, ${books.length} books, ${copies.length} copies, ${members.length} members.`
  );

  await client.end();
  process.exit(0);
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
