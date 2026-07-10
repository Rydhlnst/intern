CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."copy_condition" AS ENUM('good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."copy_status" AS ENUM('available', 'borrowed', 'lost', 'damaged', 'archived');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('borrowed', 'returned', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'librarian', 'staff', 'reader');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"copy_code" varchar(100) NOT NULL,
	"status" "copy_status" DEFAULT 'available' NOT NULL,
	"condition" "copy_condition" DEFAULT 'good' NOT NULL,
	"shelf_location" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_copies_copy_code_unique" UNIQUE("copy_code")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) NOT NULL,
	"isbn" varchar(50),
	"publication_date" date NOT NULL,
	"publisher" varchar(255) NOT NULL,
	"number_of_pages" integer NOT NULL,
	"description" text,
	"cover_url" text,
	"cover_object_key" text,
	"cover_mime_type" varchar(100),
	"cover_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"book_copy_id" integer NOT NULL,
	"borrowed_at" date NOT NULL,
	"due_date" date NOT NULL,
	"returned_at" date,
	"status" "loan_status" DEFAULT 'borrowed' NOT NULL,
	"notes" text,
	"created_by" text NOT NULL,
	"returned_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_member_code_unique" UNIQUE("member_code")
);
--> statement-breakpoint
CREATE TABLE "reader_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reader_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reader_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"book_id" integer,
	"action" varchar(50) DEFAULT 'viewed' NOT NULL,
	"query" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'reader' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_book_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."book_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_by_user_id_fk" FOREIGN KEY ("returned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_bookmarks" ADD CONSTRAINT "reader_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_bookmarks" ADD CONSTRAINT "reader_bookmarks_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_favorites" ADD CONSTRAINT "reader_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_favorites" ADD CONSTRAINT "reader_favorites_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_history" ADD CONSTRAINT "reader_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_history" ADD CONSTRAINT "reader_history_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_copies_book_status_idx" ON "book_copies" USING btree ("book_id","status");--> statement-breakpoint
CREATE INDEX "book_copies_status_idx" ON "book_copies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "books_category_id_idx" ON "books" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "books_publication_date_idx" ON "books" USING btree ("publication_date");--> statement-breakpoint
CREATE INDEX "books_created_at_idx" ON "books" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "books_isbn_idx" ON "books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "books_title_trgm_idx" ON "books" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_author_trgm_idx" ON "books" USING gin ("author" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "books_publisher_trgm_idx" ON "books" USING gin ("publisher" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "loans_member_id_idx" ON "loans" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "loans_status_idx" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loans_due_date_idx" ON "loans" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "loans_borrowed_at_idx" ON "loans" USING btree ("borrowed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "loans_one_active_per_copy" ON "loans" USING btree ("book_copy_id") WHERE "loans"."status" in ('borrowed', 'overdue');--> statement-breakpoint
CREATE INDEX "members_status_idx" ON "members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "members_name_trgm_idx" ON "members" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "reader_bookmarks_user_book_idx" ON "reader_bookmarks" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reader_favorites_user_book_idx" ON "reader_favorites" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE INDEX "reader_history_user_created_idx" ON "reader_history" USING btree ("user_id","created_at" DESC NULLS LAST);