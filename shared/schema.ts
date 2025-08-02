import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['employer', 'administrator']);

// Application status enum
export const applicationStatusEnum = pgEnum('application_status', [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected'
]);

// Application type enum
export const applicationTypeEnum = pgEnum('application_type', [
  'new_application',
  'renewal_application'
]);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('employer'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Applications table
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationRefNumber: varchar("application_ref_number").unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  applicationType: applicationTypeEnum("application_type").notNull(),
  numberOfWorkers: text("number_of_workers").notNull(),
  numberOfCertifiedWorkers: text("number_of_certified_workers").notNull(),
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  ownerBusinessAddress: text("owner_business_address"),
  asbestosServicesDescription: text("asbestos_services_description").notNull(),
  status: applicationStatusEnum("status").notNull().default('draft'),
  reviewComments: text("review_comments"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  documentType: text("document_type").notNull(), // 'insurance', 'training', 'other'
  createdAt: timestamp("created_at").defaultNow(),
});

// Application Triaging Checklist table
export const triagingChecklists = pgTable("triaging_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id),
  // Section 1 - Decision Fields
  dateOfDecision: timestamp("date_of_decision"),
  decision: text("decision"),
  preparedBy: text("prepared_by"),
  jobTitle: text("job_title"),
  // Section 2 - Employer Information
  employerLegalName: text("employer_legal_name"),
  employerTradeName: text("employer_trade_name"),
  employerId: text("employer_id"),
  activeStatus: boolean("active_status"),
  accountCoverage: text("account_coverage"),
  firmType: text("firm_type"),
  employerStartDate: timestamp("employer_start_date"),
  classificationUnits: text("classification_units"),
  employerCuStartDate: timestamp("employer_cu_start_date"),
  overdueBalance: text("overdue_balance"),
  currentAccountBalance: text("current_account_balance"),
  // Section 3 - Review Checklist
  bcCompanySummary: boolean("bc_company_summary"),
  isApplicantInScope: boolean("is_applicant_in_scope"),
  classificationUnitRelated: boolean("classification_unit_related"),
  reviewAmountsOwing: boolean("review_amounts_owing"),
  reviewNumberOfWorkers: boolean("review_number_of_workers"),
  reviewCertifiedWorkers: boolean("review_certified_workers"),
  latScreenCapture: boolean("lat_screen_capture"),
  reviewLatEscalation: boolean("review_lat_escalation"),
  reviewInjunctionViolations: boolean("review_injunction_violations"),
  reviewReferralsFromPfs: boolean("review_referrals_from_pfs"),
  reviewRenewalsConsistency: boolean("review_renewals_consistency"),
  reviewAssociatedFirms: boolean("review_associated_firms"),
  hasNophInformation: boolean("has_noph_information"),
  transportAcms: boolean("transport_acms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  reviewedApplications: many(applications, { relationName: "reviewer" }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [applications.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
  documents: many(documents),
  triagingChecklist: one(triagingChecklists),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.applicationId],
    references: [applications.id],
  }),
}));

export const triagingChecklistsRelations = relations(triagingChecklists, ({ one }) => ({
  application: one(applications, {
    fields: [triagingChecklists.applicationId],
    references: [applications.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  applicationRefNumber: true,
  userId: true,
  status: true,
  reviewComments: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertTriagingChecklistSchema = createInsertSchema(triagingChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  reviewComments: z.string().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type ApplicationWithDetails = Application & {
  user: User;
  documents: Document[];
  reviewer?: User;
  triagingChecklist?: TriagingChecklist;
};
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertTriagingChecklist = z.infer<typeof insertTriagingChecklistSchema>;
export type TriagingChecklist = typeof triagingChecklists.$inferSelect;
