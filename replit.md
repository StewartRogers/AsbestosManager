# Overview

This is an Asbestos License Management System (ALMS) - a full-stack web application that streamlines the submission, review, and management of asbestos license applications. The system serves two main user types: employers who submit license applications and administrators who review and approve them. The application provides a comprehensive digital platform for managing the entire asbestos licensing workflow, from initial application submission through final approval or rejection.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React and TypeScript, utilizing modern development practices:
- **Component Library**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
The server-side follows a RESTful API design pattern:
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for type safety
- **Authentication**: OpenID Connect (OIDC) integration with Replit's authentication system
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **File Handling**: Multer middleware for document uploads with validation
- **Error Handling**: Centralized error handling middleware with structured logging

## Database Design
PostgreSQL database with Drizzle ORM for type-safe database operations:
- **Users Table**: Stores user profiles with role-based access (employer/administrator)
- **Applications Table**: Core entity storing license application data with status tracking
- **Documents Table**: File metadata and references for uploaded application documents
- **Sessions Table**: Secure session storage for authentication state
- **Enums**: Strongly-typed enums for application status, license types, and user roles

## Authentication & Authorization
Role-based access control system:
- **Provider**: Replit OpenID Connect for secure authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Role Management**: Employer and administrator roles with distinct permissions
- **Route Protection**: Middleware-based authentication checks on protected endpoints

## File Management
Secure document handling system:
- **Upload Validation**: File type restrictions (PDF, DOC, DOCX) with size limits
- **Storage**: Local filesystem storage with unique filename generation
- **Security**: File type validation and sanitization to prevent malicious uploads

## API Design
RESTful endpoints organized by resource:
- **Authentication Routes**: Login, logout, and user profile management
- **Application Routes**: CRUD operations with status management workflow
- **Document Routes**: File upload and retrieval with application association
- **Statistics Routes**: Dashboard metrics for both user types

# External Dependencies

## Authentication Services
- **Replit OIDC**: Primary authentication provider for secure user login
- **OpenID Client Library**: Standards-compliant OIDC implementation

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with migration support

## UI Framework
- **Radix UI**: Accessible component primitives for consistent user interface
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for responsive design

## Development Tools
- **Vite**: Development server and build tool with hot module replacement
- **TypeScript**: Static type checking for improved code quality
- **ESBuild**: Fast JavaScript bundler for production builds

## File Processing
- **Multer**: Multipart form data handling for file uploads
- **File System**: Node.js native file system operations for document storage

## State Management
- **TanStack React Query**: Server state management with intelligent caching
- **React Hook Form**: Form state management with validation integration
- **Zod**: Runtime type validation for form data and API schemas