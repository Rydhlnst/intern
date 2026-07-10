CREATE TABLE "book_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"content_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_reviews_rating_range" CHECK ("book_reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "description" SET DATA TYPE jsonb USING CASE
    WHEN "description" IS NULL OR "description" = '' THEN NULL
    ELSE jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', "description")
          )
        )
      )
    )
  END;--> statement-breakpoint
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "book_reviews_user_book_idx" ON "book_reviews" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE INDEX "book_reviews_book_created_idx" ON "book_reviews" USING btree ("book_id","created_at" DESC NULLS LAST);