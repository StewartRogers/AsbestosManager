CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."application_type" AS ENUM('new_application', 'renewal_application');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('employer', 'administrator');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_ref_number" varchar,
	"user_id" varchar NOT NULL,
	"application_type" "application_type" NOT NULL,
	"number_of_workers" text NOT NULL,
	"number_of_certified_workers" text NOT NULL,
	"owner_name" text,
	"owner_email" text,
	"owner_phone" text,
	"owner_business_address" text,
	"asbestos_services_description" text NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"review_comments" text,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "applications_application_ref_number_unique" UNIQUE("application_ref_number")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" text NOT NULL,
	"document_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triaging_checklists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"date_of_decision" timestamp,
	"decision" text,
	"prepared_by" text,
	"job_title" text,
	"employer_legal_name" text,
	"employer_trade_name" text,
	"employer_id" text,
	"active_status" boolean,
	"account_coverage" text,
	"firm_type" text,
	"employer_start_date" timestamp,
	"classification_units" text,
	"employer_cu_start_date" timestamp,
	"overdue_balance" text,
	"current_account_balance" text,
	"bc_company_summary" boolean,
	"is_applicant_in_scope" boolean,
	"classification_unit_related" boolean,
	"review_amounts_owing" boolean,
	"review_number_of_workers" boolean,
	"review_certified_workers" boolean,
	"lat_screen_capture" boolean,
	"review_lat_escalation" boolean,
	"review_injunction_violations" boolean,
	"review_referrals_from_pfs" boolean,
	"review_renewals_consistency" boolean,
	"review_associated_firms" boolean,
	"has_noph_information" boolean,
	"transport_acms" boolean,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'employer' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triaging_checklists" ADD CONSTRAINT "triaging_checklists_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");