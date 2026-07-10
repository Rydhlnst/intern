CREATE TYPE "public"."email_event_status" AS ENUM('planned', 'queued', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."email_template_key" AS ENUM('auth_welcome', 'auth_verification', 'auth_password_reset', 'reader_overdue_reminder', 'reader_waitlist_ready', 'system_announcement');--> statement-breakpoint
CREATE TYPE "public"."email_trigger_source" AS ENUM('auth', 'reader', 'admin', 'system');--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"recipient_email" varchar(255) NOT NULL,
	"template_key" "email_template_key" NOT NULL,
	"trigger_source" "email_trigger_source" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "email_event_status" DEFAULT 'planned' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_email_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"auth_emails_enabled" boolean DEFAULT true NOT NULL,
	"reader_notifications_enabled" boolean DEFAULT true NOT NULL,
	"operational_emails_enabled" boolean DEFAULT true NOT NULL,
	"marketing_emails_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_preferences" ADD CONSTRAINT "user_email_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_events_user_created_idx" ON "email_events" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_events_template_created_idx" ON "email_events" USING btree ("template_key","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_events_status_created_idx" ON "email_events" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_preferences_user_idx" ON "user_email_preferences" USING btree ("user_id");