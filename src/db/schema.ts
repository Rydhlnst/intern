import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  integer,
  date,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "librarian",
  "staff",
  "viewer",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

export const copyStatusEnum = pgEnum("copy_status", [
  "available",
  "borrowed",
  "lost",
  "damaged",
  "archived",
]);

export const copyConditionEnum = pgEnum("copy_condition", [
  "good",
  "fair",
  "poor",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "suspended",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "borrowed",
  "returned",
  "overdue",
]);

// Better Auth tables (managed by better-auth, extended with role/status)
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("viewer"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").unique().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App tables
export const bookCategories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => bookCategories.id),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 50 }),
  publicationDate: date("publication_date").notNull(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  numberOfPages: integer("number_of_pages").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  coverObjectKey: text("cover_object_key"),
  coverMimeType: varchar("cover_mime_type", { length: 100 }),
  coverSize: integer("cover_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookCopies = pgTable("book_copies", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id),
  copyCode: varchar("copy_code", { length: 100 }).unique().notNull(),
  status: copyStatusEnum("status").notNull().default("available"),
  condition: copyConditionEnum("condition").notNull().default("good"),
  shelfLocation: varchar("shelf_location", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  memberCode: varchar("member_code", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  status: memberStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id),
  bookCopyId: integer("book_copy_id")
    .notNull()
    .references(() => bookCopies.id),
  borrowedAt: date("borrowed_at").notNull(),
  dueDate: date("due_date").notNull(),
  returnedAt: date("returned_at"),
  status: loanStatusEnum("status").notNull().default("borrowed"),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  returnedBy: text("returned_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdLoans: many(loans, { relationName: "createdLoans" }),
  returnedLoans: many(loans, { relationName: "returnedLoans" }),
}));

export const bookCategoriesRelations = relations(
  bookCategories,
  ({ many }) => ({
    books: many(books),
  })
);

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(bookCategories, {
    fields: [books.categoryId],
    references: [bookCategories.id],
  }),
  copies: many(bookCopies),
}));

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
  book: one(books, {
    fields: [bookCopies.bookId],
    references: [books.id],
  }),
  loans: many(loans),
}));

export const membersRelations = relations(members, ({ many }) => ({
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
  bookCopy: one(bookCopies, {
    fields: [loans.bookCopyId],
    references: [bookCopies.id],
  }),
  creator: one(users, {
    fields: [loans.createdBy],
    references: [users.id],
    relationName: "createdLoans",
  }),
  returner: one(users, {
    fields: [loans.returnedBy],
    references: [users.id],
    relationName: "returnedLoans",
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BookCategory = typeof bookCategories.$inferSelect;
export type NewBookCategory = typeof bookCategories.$inferInsert;
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type BookCopy = typeof bookCopies.$inferSelect;
export type NewBookCopy = typeof bookCopies.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
