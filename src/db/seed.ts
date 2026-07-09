import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { auth } from "../auth/config";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function createUser(
  name: string,
  email: string,
  password: string,
  role: schema.User["role"]
) {
  const result = await auth.api.signUpEmail({
    body: { name, email, password },
  });

  if (!result?.user?.id) throw new Error(`Failed to create user: ${email}`);

  await db
    .update(schema.users)
    .set({ role, status: "active" })
    .where(
      (await import("drizzle-orm")).eq(schema.users.id, result.user.id)
    );

  return result.user;
}

async function main() {
  console.log("Seeding database...");

  const { eq } = await import("drizzle-orm");

  // Users
  console.log("Creating users...");
  await createUser("Super Admin", "admin@example.com", "password", "super_admin");
  await createUser("Librarian", "librarian@example.com", "password", "librarian");
  await createUser("Staff", "staff@example.com", "password", "staff");
  await createUser("Viewer", "viewer@example.com", "password", "viewer");

  // Categories
  console.log("Creating categories...");
  const categoryData = [
    { name: "Fiction", description: "Fictional literature and novels" },
    { name: "Business", description: "Business, management, and entrepreneurship" },
    { name: "Technology", description: "Software, hardware, and tech trends" },
    { name: "History", description: "World history and historical events" },
    { name: "Science", description: "Natural science, physics, biology, and more" },
  ];

  const insertedCategories = await db
    .insert(schema.bookCategories)
    .values(categoryData)
    .returning();

  const catMap = Object.fromEntries(insertedCategories.map((c) => [c.name, c.id]));

  // Books
  console.log("Creating books...");
  const booksData = [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "9780132350884",
      publicationDate: "2008-08-01",
      publisher: "Prentice Hall",
      numberOfPages: 431,
      categoryId: catMap["Technology"],
      description: "A handbook of agile software craftsmanship.",
    },
    {
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      isbn: "9780135957059",
      publicationDate: "2019-09-23",
      publisher: "Addison-Wesley",
      numberOfPages: 352,
      categoryId: catMap["Technology"],
      description: "Your journey to mastery.",
    },
    {
      title: "Design Patterns",
      author: "Gang of Four",
      isbn: "9780201633610",
      publicationDate: "1994-10-31",
      publisher: "Addison-Wesley",
      numberOfPages: 395,
      categoryId: catMap["Technology"],
      description: "Elements of reusable object-oriented software.",
    },
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "9780743273565",
      publicationDate: "1925-04-10",
      publisher: "Scribner",
      numberOfPages: 180,
      categoryId: catMap["Fiction"],
      description: "A novel set in the Jazz Age.",
    },
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "9780061935466",
      publicationDate: "1960-07-11",
      publisher: "HarperCollins",
      numberOfPages: 281,
      categoryId: catMap["Fiction"],
      description: "A story of racial injustice and childhood in Alabama.",
    },
    {
      title: "1984",
      author: "George Orwell",
      isbn: "9780451524935",
      publicationDate: "1949-06-08",
      publisher: "Signet Classic",
      numberOfPages: 328,
      categoryId: catMap["Fiction"],
      description: "A dystopian novel about totalitarianism.",
    },
    {
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      isbn: "9780374533557",
      publicationDate: "2011-10-25",
      publisher: "Farrar, Straus and Giroux",
      numberOfPages: 499,
      categoryId: catMap["Science"],
      description: "Two systems that drive the way we think.",
    },
    {
      title: "Sapiens",
      author: "Yuval Noah Harari",
      isbn: "9780062316097",
      publicationDate: "2015-02-10",
      publisher: "Harper",
      numberOfPages: 443,
      categoryId: catMap["History"],
      description: "A brief history of humankind.",
    },
    {
      title: "Homo Deus",
      author: "Yuval Noah Harari",
      isbn: "9780062464316",
      publicationDate: "2017-02-21",
      publisher: "Harper",
      numberOfPages: 464,
      categoryId: catMap["History"],
      description: "A brief history of tomorrow.",
    },
    {
      title: "Good to Great",
      author: "Jim Collins",
      isbn: "9780066620992",
      publicationDate: "2001-10-16",
      publisher: "HarperBusiness",
      numberOfPages: 300,
      categoryId: catMap["Business"],
      description: "Why some companies make the leap and others don't.",
    },
    {
      title: "Zero to One",
      author: "Peter Thiel",
      isbn: "9780804139021",
      publicationDate: "2014-09-16",
      publisher: "Crown Business",
      numberOfPages: 224,
      categoryId: catMap["Business"],
      description: "Notes on startups, or how to build the future.",
    },
    {
      title: "The Lean Startup",
      author: "Eric Ries",
      isbn: "9780307887894",
      publicationDate: "2011-09-13",
      publisher: "Crown Business",
      numberOfPages: 336,
      categoryId: catMap["Business"],
      description: "How today's entrepreneurs use continuous innovation.",
    },
    {
      title: "A Brief History of Time",
      author: "Stephen Hawking",
      isbn: "9780553380163",
      publicationDate: "1988-04-01",
      publisher: "Bantam",
      numberOfPages: 212,
      categoryId: catMap["Science"],
      description: "From the Big Bang to black holes.",
    },
    {
      title: "The Origin of Species",
      author: "Charles Darwin",
      isbn: "9780486450063",
      publicationDate: "1859-11-24",
      publisher: "Dover Publications",
      numberOfPages: 432,
      categoryId: catMap["Science"],
      description: "The foundation of evolutionary biology.",
    },
    {
      title: "Cosmos",
      author: "Carl Sagan",
      isbn: "9780345539435",
      publicationDate: "1980-09-22",
      publisher: "Random House",
      numberOfPages: 365,
      categoryId: catMap["Science"],
      description: "A personal voyage through the universe.",
    },
    {
      title: "The Art of War",
      author: "Sun Tzu",
      isbn: "9780140455526",
      publicationDate: "0500-01-01",
      publisher: "Penguin Classics",
      numberOfPages: 130,
      categoryId: catMap["History"],
      description: "An ancient Chinese military treatise.",
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      isbn: "9780441013593",
      publicationDate: "1965-08-01",
      publisher: "Chilton Books",
      numberOfPages: 688,
      categoryId: catMap["Fiction"],
      description: "A science fiction epic set on a desert planet.",
    },
    {
      title: "The Hitchhiker's Guide to the Galaxy",
      author: "Douglas Adams",
      isbn: "9780345391803",
      publicationDate: "1979-10-12",
      publisher: "Pan Books",
      numberOfPages: 193,
      categoryId: catMap["Fiction"],
      description: "A comedy science fiction series.",
    },
    {
      title: "Rich Dad Poor Dad",
      author: "Robert Kiyosaki",
      isbn: "9781612680194",
      publicationDate: "1997-04-01",
      publisher: "Warner Books",
      numberOfPages: 207,
      categoryId: catMap["Business"],
      description: "What the rich teach their kids about money.",
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      isbn: "9780735211292",
      publicationDate: "2018-10-16",
      publisher: "Avery",
      numberOfPages: 320,
      categoryId: catMap["Business"],
      description: "An easy and proven way to build good habits.",
    },
  ];

  const insertedBooks = await db
    .insert(schema.books)
    .values(booksData)
    .returning();

  // Book Copies
  console.log("Creating book copies...");
  const copiesData = [];
  for (const book of insertedBooks.slice(0, 10)) {
    copiesData.push(
      {
        bookId: book.id,
        copyCode: `${book.id.toString().padStart(3, "0")}-A`,
        status: "available" as const,
        condition: "good" as const,
        shelfLocation: `Shelf ${String.fromCharCode(65 + (book.id % 5))}`,
      },
      {
        bookId: book.id,
        copyCode: `${book.id.toString().padStart(3, "0")}-B`,
        status: "available" as const,
        condition: "good" as const,
        shelfLocation: `Shelf ${String.fromCharCode(65 + (book.id % 5))}`,
      },
      {
        bookId: book.id,
        copyCode: `${book.id.toString().padStart(3, "0")}-C`,
        status: "available" as const,
        condition: "fair" as const,
        shelfLocation: `Shelf ${String.fromCharCode(65 + (book.id % 5))}`,
      }
    );
  }
  for (const book of insertedBooks.slice(10)) {
    copiesData.push({
      bookId: book.id,
      copyCode: `${book.id.toString().padStart(3, "0")}-A`,
      status: "available" as const,
      condition: "good" as const,
      shelfLocation: `Shelf ${String.fromCharCode(65 + (book.id % 5))}`,
    });
  }

  const insertedCopies = await db
    .insert(schema.bookCopies)
    .values(copiesData)
    .returning();

  // Members
  console.log("Creating members...");
  const membersData = [
    { memberCode: "MBR001", name: "Ahmad Fauzi", email: "ahmad@example.com", phone: "081234567890", status: "active" as const },
    { memberCode: "MBR002", name: "Siti Rahayu", email: "siti@example.com", phone: "081234567891", status: "active" as const },
    { memberCode: "MBR003", name: "Budi Santoso", email: "budi@example.com", phone: "081234567892", status: "active" as const },
    { memberCode: "MBR004", name: "Dewi Kusuma", email: "dewi@example.com", phone: "081234567893", status: "active" as const },
    { memberCode: "MBR005", name: "Eko Prasetyo", email: "eko@example.com", phone: "081234567894", status: "active" as const },
    { memberCode: "MBR006", name: "Fitri Handayani", email: "fitri@example.com", phone: "081234567895", status: "active" as const },
    { memberCode: "MBR007", name: "Galih Wicaksono", email: "galih@example.com", phone: "081234567896", status: "inactive" as const },
    { memberCode: "MBR008", name: "Hani Pertiwi", email: "hani@example.com", phone: "081234567897", status: "active" as const },
    { memberCode: "MBR009", name: "Irfan Maulana", email: "irfan@example.com", phone: "081234567898", status: "suspended" as const },
    { memberCode: "MBR010", name: "Joko Widodo", email: "joko@example.com", phone: "081234567899", status: "active" as const },
  ];

  const insertedMembers = await db
    .insert(schema.members)
    .values(membersData)
    .returning();

  // Get admin user for created_by
  const adminUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "admin@example.com"),
  });

  if (!adminUser) throw new Error("Admin user not found");

  const today = new Date();
  const pastDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };
  const futureDate = (daysFromNow: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split("T")[0];
  };

  // Loans
  console.log("Creating loans...");

  // 3 active loans (mark copies as borrowed)
  const activeLoanCopies = insertedCopies.slice(0, 3);
  for (const copy of activeLoanCopies) {
    await db.update(schema.bookCopies).set({ status: "borrowed" }).where(eq(schema.bookCopies.id, copy.id));
  }

  await db.insert(schema.loans).values([
    {
      memberId: insertedMembers[0].id,
      bookCopyId: activeLoanCopies[0].id,
      borrowedAt: pastDate(5),
      dueDate: futureDate(9),
      status: "borrowed",
      createdBy: adminUser.id,
    },
    {
      memberId: insertedMembers[1].id,
      bookCopyId: activeLoanCopies[1].id,
      borrowedAt: pastDate(3),
      dueDate: futureDate(11),
      status: "borrowed",
      createdBy: adminUser.id,
    },
    {
      memberId: insertedMembers[2].id,
      bookCopyId: activeLoanCopies[2].id,
      borrowedAt: pastDate(7),
      dueDate: futureDate(7),
      status: "borrowed",
      createdBy: adminUser.id,
    },
  ]);

  // 2 returned loans
  await db.insert(schema.loans).values([
    {
      memberId: insertedMembers[3].id,
      bookCopyId: insertedCopies[3].id,
      borrowedAt: pastDate(20),
      dueDate: pastDate(6),
      returnedAt: pastDate(8),
      status: "returned",
      createdBy: adminUser.id,
      returnedBy: adminUser.id,
    },
    {
      memberId: insertedMembers[4].id,
      bookCopyId: insertedCopies[4].id,
      borrowedAt: pastDate(30),
      dueDate: pastDate(16),
      returnedAt: pastDate(18),
      status: "returned",
      createdBy: adminUser.id,
      returnedBy: adminUser.id,
    },
  ]);

  // 2 overdue loans (mark copies as borrowed)
  const overdueLoanCopies = insertedCopies.slice(5, 7);
  for (const copy of overdueLoanCopies) {
    await db.update(schema.bookCopies).set({ status: "borrowed" }).where(eq(schema.bookCopies.id, copy.id));
  }

  await db.insert(schema.loans).values([
    {
      memberId: insertedMembers[5].id,
      bookCopyId: overdueLoanCopies[0].id,
      borrowedAt: pastDate(20),
      dueDate: pastDate(6),
      status: "overdue",
      createdBy: adminUser.id,
    },
    {
      memberId: insertedMembers[7].id,
      bookCopyId: overdueLoanCopies[1].id,
      borrowedAt: pastDate(30),
      dueDate: pastDate(16),
      status: "overdue",
      createdBy: adminUser.id,
    },
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
