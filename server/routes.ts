import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertApplicationSchema, updateApplicationStatusSchema, insertTriagingChecklistSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Application routes
  app.post('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applicationData = insertApplicationSchema.parse(req.body);
      
      const application = await storage.createApplication({
        ...applicationData,
        userId,
      });
      
      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(400).json({ message: "Failed to create application" });
    }
  });

  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let applications;
      if (user?.role === 'administrator') {
        const { status, applicationType, search } = req.query;
        applications = await storage.getAllApplications({
          status: status as string,
          applicationType: applicationType as string,
          search: search as string,
        });
      } else {
        applications = await storage.getUserApplications(userId);
      }
      
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const application = await storage.getApplication(req.params.id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check access permissions
      if (user?.role !== 'administrator' && application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.patch('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const application = await storage.getApplication(req.params.id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Check access permissions
      if (user?.role !== 'administrator' && application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const applicationData = insertApplicationSchema.partial().parse(req.body);
      const updatedApplication = await storage.updateApplication(req.params.id, applicationData);
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(400).json({ message: "Failed to update application" });
    }
  });

  app.patch('/api/applications/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'administrator') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { status, reviewComments } = updateApplicationStatusSchema.parse(req.body);
      const updatedApplication = await storage.updateApplicationStatus(
        req.params.id,
        status,
        reviewComments,
        userId
      );
      
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(400).json({ message: "Failed to update application status" });
    }
  });

  // Document upload routes
  app.post('/api/applications/:id/documents', isAuthenticated, upload.array('documents'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const application = await storage.getApplication(req.params.id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      if (application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const files = req.files as Express.Multer.File[];
      const documents = [];
      
      for (const file of files) {
        const document = await storage.createDocument({
          applicationId: req.params.id,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size.toString(),
          documentType: req.body.documentType || 'other',
        });
        documents.push(document);
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(400).json({ message: "Failed to upload documents" });
    }
  });

  app.get('/api/documents/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Find document and check permissions
      const allApplications = await storage.getAllApplications();
      let document;
      let hasAccess = false;
      
      for (const app of allApplications) {
        const doc = app.documents.find(d => d.id === req.params.id);
        if (doc) {
          document = doc;
          hasAccess = user?.role === 'administrator' || app.userId === userId;
          break;
        }
      }
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const filePath = path.join(uploadDir, document.fileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.download(filePath, document.originalName);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Statistics routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'administrator') {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } else {
        const stats = await storage.getApplicationStats(userId);
        res.json(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Triaging Checklist routes
  app.post('/api/applications/:id/triaging-checklist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'administrator') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const checklistData = insertTriagingChecklistSchema.parse(req.body);
      
      // Check if checklist already exists
      const existing = await storage.getTriagingChecklist(req.params.id);
      let checklist;
      
      if (existing) {
        checklist = await storage.updateTriagingChecklist(req.params.id, checklistData);
      } else {
        checklist = await storage.createTriagingChecklist({
          ...checklistData,
          applicationId: req.params.id,
        });
      }
      
      res.json(checklist);
    } catch (error) {
      console.error("Error saving triaging checklist:", error);
      res.status(400).json({ message: "Failed to save triaging checklist" });
    }
  });

  app.get('/api/triaging-checklist/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'administrator') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const checklist = await storage.getTriagingChecklist(req.params.applicationId);
      res.json(checklist || {});
    } catch (error) {
      console.error("Error fetching triaging checklist:", error);
      res.status(500).json({ message: "Failed to fetch triaging checklist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
