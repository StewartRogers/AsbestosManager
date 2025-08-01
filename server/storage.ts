import {
  users,
  applications,
  documents,
  triagingChecklists,
  type User,
  type UpsertUser,
  type InsertApplication,
  type Application,
  type ApplicationWithDetails,
  type InsertDocument,
  type Document,
  type InsertTriagingChecklist,
  type TriagingChecklist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Application operations
  createApplication(application: InsertApplication & { userId: string }): Promise<Application>;
  updateApplication(id: string, application: Partial<InsertApplication>): Promise<Application>;
  getApplication(id: string): Promise<ApplicationWithDetails | undefined>;
  getUserApplications(userId: string): Promise<ApplicationWithDetails[]>;
  getAllApplications(filters?: { status?: string; applicationType?: string; search?: string }): Promise<ApplicationWithDetails[]>;
  updateApplicationStatus(id: string, status: string, reviewComments?: string, reviewerId?: string): Promise<Application>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getApplicationDocuments(applicationId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  
  // Triaging Checklist operations
  createTriagingChecklist(checklist: InsertTriagingChecklist): Promise<TriagingChecklist>;
  updateTriagingChecklist(applicationId: string, checklist: Partial<InsertTriagingChecklist>): Promise<TriagingChecklist>;
  getTriagingChecklist(applicationId: string): Promise<TriagingChecklist | undefined>;
  
  // Statistics
  getApplicationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
  }>;
  
  getAdminStats(): Promise<{
    pending: number;
    processedToday: number;
    overdue: number;
    thisWeek: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: userData.role || 'employer', // Default to employer role
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          role: userData.role || 'employer',
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Application operations
  async createApplication(applicationData: InsertApplication & { userId: string }): Promise<Application> {
    // Generate application reference number
    const refNumber = 'ALM-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    const [application] = await db
      .insert(applications)
      .values({
        ...applicationData,
        applicationRefNumber: refNumber,
      })
      .returning();
    return application;
  }

  async updateApplication(id: string, applicationData: Partial<InsertApplication>): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ ...applicationData, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async getApplication(id: string): Promise<ApplicationWithDetails | undefined> {
    const result = await db
      .select()
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(documents, eq(applications.id, documents.applicationId))
      .where(eq(applications.id, id));

    if (result.length === 0) return undefined;

    const application = result[0].applications;
    const user = result[0].users!;
    const docs = result.filter(r => r.documents).map(r => r.documents!);

    return {
      ...application,
      user,
      documents: docs,
    };
  }

  async getUserApplications(userId: string): Promise<ApplicationWithDetails[]> {
    const result = await db
      .select()
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(documents, eq(applications.id, documents.applicationId))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));

    const applicationMap = new Map<string, ApplicationWithDetails>();

    for (const row of result) {
      const app = row.applications;
      const user = row.users!;
      const doc = row.documents;

      if (!applicationMap.has(app.id)) {
        applicationMap.set(app.id, {
          ...app,
          user,
          documents: [],
        });
      }

      if (doc) {
        applicationMap.get(app.id)!.documents.push(doc);
      }
    }

    return Array.from(applicationMap.values());
  }

  async getAllApplications(filters?: { status?: string; applicationType?: string; search?: string }): Promise<ApplicationWithDetails[]> {
    let baseQuery = db
      .select()
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .leftJoin(documents, eq(applications.id, documents.applicationId));

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(applications.status, filters.status as any));
    }

    if (filters?.applicationType) {
      conditions.push(eq(applications.applicationType, filters.applicationType as any));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(applications.applicationRefNumber, `%${filters.search}%`),
          ilike(applications.ownerContactInfo, `%${filters.search}%`),
          ilike(applications.asbestosServicesDescription, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    const result = await baseQuery.orderBy(desc(applications.createdAt));

    const applicationMap = new Map<string, ApplicationWithDetails>();

    for (const row of result) {
      const app = row.applications;
      const user = row.users!;
      const doc = row.documents;

      if (!applicationMap.has(app.id)) {
        applicationMap.set(app.id, {
          ...app,
          user,
          documents: [],
        });
      }

      if (doc) {
        applicationMap.get(app.id)!.documents.push(doc);
      }
    }

    return Array.from(applicationMap.values());
  }

  async updateApplicationStatus(id: string, status: string, reviewComments?: string, reviewerId?: string): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({
        status: status as any,
        reviewComments,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return document;
  }

  async getApplicationDocuments(applicationId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.applicationId, applicationId));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Triaging Checklist operations
  async createTriagingChecklist(checklistData: InsertTriagingChecklist): Promise<TriagingChecklist> {
    const [checklist] = await db
      .insert(triagingChecklists)
      .values(checklistData)
      .returning();
    return checklist;
  }

  async updateTriagingChecklist(applicationId: string, checklistData: Partial<InsertTriagingChecklist>): Promise<TriagingChecklist> {
    const [checklist] = await db
      .update(triagingChecklists)
      .set({ ...checklistData, updatedAt: new Date() })
      .where(eq(triagingChecklists.applicationId, applicationId))
      .returning();
    return checklist;
  }

  async getTriagingChecklist(applicationId: string): Promise<TriagingChecklist | undefined> {
    const [checklist] = await db
      .select()
      .from(triagingChecklists)
      .where(eq(triagingChecklists.applicationId, applicationId));
    return checklist;
  }

  // Statistics
  async getApplicationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
  }> {
    let baseQuery = db.select().from(applications);
    
    if (userId) {
      baseQuery = baseQuery.where(eq(applications.userId, userId));
    }

    const allApplications = await baseQuery;

    return {
      total: allApplications.length,
      pending: allApplications.filter(app => app.status === 'under_review' || app.status === 'submitted').length,
      approved: allApplications.filter(app => app.status === 'approved').length,
      rejected: allApplications.filter(app => app.status === 'rejected').length,
      draft: allApplications.filter(app => app.status === 'draft').length,
    };
  }

  async getAdminStats(): Promise<{
    pending: number;
    processedToday: number;
    overdue: number;
    thisWeek: number;
  }> {
    const allApplications = await db.select().from(applications);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      pending: allApplications.filter(app => app.status === 'submitted' || app.status === 'under_review').length,
      processedToday: allApplications.filter(app => 
        app.reviewedAt && new Date(app.reviewedAt) >= today
      ).length,
      overdue: allApplications.filter(app => 
        (app.status === 'submitted' || app.status === 'under_review') &&
        new Date(app.createdAt!) < new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)
      ).length,
      thisWeek: allApplications.filter(app => 
        new Date(app.createdAt!) >= weekAgo
      ).length,
    };
  }
}

export const storage = new DatabaseStorage();
