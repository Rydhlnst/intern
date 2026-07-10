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
  index,
  uniqueIndex,
  jsonb,
  check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import type { TiptapDoc } from "@/lib/tiptap/types"

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "librarian",
  "staff",
  "reader",
])

export const userStatusEnum = pgEnum("user_status", ["active", "inactive"])

export const copyStatusEnum = pgEnum("copy_status", [
  "available",
  "borrowed",
  "lost",
  "damaged",
  "archived",
])

export const copyConditionEnum = pgEnum("copy_condition", [
  "good",
  "fair",
  "poor",
])

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "inactive",
  "suspended",
])

export const loanStatusEnum = pgEnum("loan_status", [
  "borrowed",
  "returned",
  "overdue",
])

export const emailTemplateKeyEnum = pgEnum("email_template_key", [
  "auth_welcome",
  "auth_verification",
  "auth_password_reset",
  "reader_overdue_reminder",
  "reader_waitlist_ready",
  "system_announcement",
])

export const emailTriggerSourceEnum = pgEnum("email_trigger_source", [
  "auth",
  "reader",
  "admin",
  "system",
])

export const emailEventStatusEnum = pgEnum("email_event_status", [
  "planned",
  "queued",
  "sent",
  "failed",
  "skipped",
])

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("reader"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

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
})

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
})

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const bookCategories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const books = pgTable(
  "books",
  {
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
    description: jsonb("description").$type<TiptapDoc>(),
    coverUrl: text("cover_url"),
    coverObjectKey: text("cover_object_key"),
    coverMimeType: varchar("cover_mime_type", { length: 100 }),
    coverSize: integer("cover_size"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("books_category_id_idx").on(t.categoryId),
    index("books_publication_date_idx").on(t.publicationDate),
    index("books_created_at_idx").on(t.createdAt),
    index("books_isbn_idx").on(t.isbn),
    index("books_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
    index("books_author_trgm_idx").using("gin", sql`${t.author} gin_trgm_ops`),
    index("books_publisher_trgm_idx").using("gin", sql`${t.publisher} gin_trgm_ops`),
  ]
)

export const bookCopies = pgTable(
  "book_copies",
  {
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
  },
  (t) => [
    index("book_copies_book_status_idx").on(t.bookId, t.status),
    index("book_copies_status_idx").on(t.status),
  ]
)

export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    memberCode: varchar("member_code", { length: 100 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    address: text("address"),
    status: memberStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("members_status_idx").on(t.status),
    index("members_name_trgm_idx").using("gin", sql`${t.name} gin_trgm_ops`),
  ]
)

export const loans = pgTable(
  "loans",
  {
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
  },
  (t) => [
    index("loans_member_id_idx").on(t.memberId),
    index("loans_status_idx").on(t.status),
    index("loans_due_date_idx").on(t.dueDate),
    index("loans_borrowed_at_idx").on(t.borrowedAt),
    uniqueIndex("loans_one_active_per_copy")
      .on(t.bookCopyId)
      .where(sql`${t.status} in ('borrowed', 'overdue')`),
  ]
)

export const readerBookmarks = pgTable(
  "reader_bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userBookUnique: uniqueIndex("reader_bookmarks_user_book_idx").on(
      table.userId,
      table.bookId
    ),
  })
)

export const readerFavorites = pgTable(
  "reader_favorites",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userBookUnique: uniqueIndex("reader_favorites_user_book_idx").on(
      table.userId,
      table.bookId
    ),
  })
)

export const readerHistory = pgTable(
  "reader_history",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookId: integer("book_id").references(() => books.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull().default("viewed"),
    query: varchar("query", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reader_history_user_created_idx").on(t.userId, t.createdAt.desc())]
)

export const userEmailPreferences = pgTable(
  "user_email_preferences",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authEmailsEnabled: boolean("auth_emails_enabled").notNull().default(true),
    readerNotificationsEnabled: boolean("reader_notifications_enabled")
      .notNull()
      .default(true),
    operationalEmailsEnabled: boolean("operational_emails_enabled")
      .notNull()
      .default(true),
    marketingEmailsEnabled: boolean("marketing_emails_enabled")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_email_preferences_user_idx").on(t.userId)]
)

export const emailEvents = pgTable(
  "email_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    templateKey: emailTemplateKeyEnum("template_key").notNull(),
    triggerSource: emailTriggerSourceEnum("trigger_source").notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: emailEventStatusEnum("status").notNull().default("planned"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("email_events_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("email_events_template_created_idx").on(t.templateKey, t.createdAt.desc()),
    index("email_events_status_created_idx").on(t.status, t.createdAt.desc()),
  ]
)

export const bookReviews = pgTable(
  "book_reviews",
  {
    id: serial("id").primaryKey(),
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    contentJson: jsonb("content_json").$type<TiptapDoc>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("book_reviews_user_book_idx").on(t.userId, t.bookId),
    index("book_reviews_book_created_idx").on(t.bookId, t.createdAt.desc()),
    check("book_reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ]
)

export const usersRelations = relations(users, ({ many }) => ({
  createdLoans: many(loans, { relationName: "createdLoans" }),
  returnedLoans: many(loans, { relationName: "returnedLoans" }),
  bookmarks: many(readerBookmarks),
  favorites: many(readerFavorites),
  history: many(readerHistory),
  emailPreferences: many(userEmailPreferences),
  emailEvents: many(emailEvents),
}))

export const bookCategoriesRelations = relations(bookCategories, ({ many }) => ({
  books: many(books),
}))

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(bookCategories, {
    fields: [books.categoryId],
    references: [bookCategories.id],
  }),
  copies: many(bookCopies),
  bookmarks: many(readerBookmarks),
  favorites: many(readerFavorites),
  history: many(readerHistory),
  reviews: many(bookReviews),
}))

export const bookReviewsRelations = relations(bookReviews, ({ one }) => ({
  book: one(books, {
    fields: [bookReviews.bookId],
    references: [books.id],
  }),
  user: one(users, {
    fields: [bookReviews.userId],
    references: [users.id],
  }),
}))

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
  book: one(books, {
    fields: [bookCopies.bookId],
    references: [books.id],
  }),
  loans: many(loans),
}))

export const membersRelations = relations(members, ({ many }) => ({
  loans: many(loans),
}))

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
}))

export const readerBookmarksRelations = relations(readerBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [readerBookmarks.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [readerBookmarks.bookId],
    references: [books.id],
  }),
}))

export const readerFavoritesRelations = relations(readerFavorites, ({ one }) => ({
  user: one(users, {
    fields: [readerFavorites.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [readerFavorites.bookId],
    references: [books.id],
  }),
}))

export const readerHistoryRelations = relations(readerHistory, ({ one }) => ({
  user: one(users, {
    fields: [readerHistory.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [readerHistory.bookId],
    references: [books.id],
  }),
}))

export const userEmailPreferencesRelations = relations(
  userEmailPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userEmailPreferences.userId],
      references: [users.id],
    }),
  })
)

export const emailEventsRelations = relations(emailEvents, ({ one }) => ({
  user: one(users, {
    fields: [emailEvents.userId],
    references: [users.id],
  }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type BookCategory = typeof bookCategories.$inferSelect
export type NewBookCategory = typeof bookCategories.$inferInsert
export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert
export type BookCopy = typeof bookCopies.$inferSelect
export type NewBookCopy = typeof bookCopies.$inferInsert
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type Loan = typeof loans.$inferSelect
export type NewLoan = typeof loans.$inferInsert
export type ReaderBookmark = typeof readerBookmarks.$inferSelect
export type NewReaderBookmark = typeof readerBookmarks.$inferInsert
export type ReaderFavorite = typeof readerFavorites.$inferSelect
export type NewReaderFavorite = typeof readerFavorites.$inferInsert
export type ReaderHistory = typeof readerHistory.$inferSelect
export type NewReaderHistory = typeof readerHistory.$inferInsert
export type UserEmailPreference = typeof userEmailPreferences.$inferSelect
export type NewUserEmailPreference = typeof userEmailPreferences.$inferInsert
export type EmailEvent = typeof emailEvents.$inferSelect
export type NewEmailEvent = typeof emailEvents.$inferInsert
