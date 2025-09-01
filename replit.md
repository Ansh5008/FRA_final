# FRA ACT - AI Powered Forest Resource Assessment Dashboard

## Overview

FRA ACT is an AI-powered WebGIS Decision Support System designed for transparent, real-time monitoring of Forest Rights Act implementation. Built as a hackathon demo project, it addresses fragmented FRA implementation across tribal communities in states like Madhya Pradesh, Tripura, Odisha, and Telangana. The system features real-time claim monitoring, AI-based anomaly detection, interactive GIS dashboards, smart alerts, and beneficiary transparency tools. The application maintains an earthy forest-inspired design with smooth animations and professional presentation suitable for government officials, tribal communities, and policy stakeholders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built using React with TypeScript and Vite as the build tool. The application follows a component-based architecture with:

- **UI Framework**: React 18 with hooks and functional components
- **Styling**: TailwindCSS with CSS variables for theming, shadcn/ui component library with Radix UI primitives
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Animations**: Framer Motion for smooth transitions and scroll-triggered animations, AOS (Animate On Scroll) library
- **Typography**: Google Fonts (Inter, Space Grotesk, Montserrat, Poppins) with Font Awesome icons

### Backend Architecture
The server follows a simple Express.js REST API pattern:

- **Framework**: Express.js with TypeScript
- **Build System**: esbuild for production bundling, tsx for development
- **Middleware**: Custom logging middleware for API request tracking
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Vite dev server integration with HMR support

### Data Storage Solutions
The application uses a dual storage approach:

- **Production Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Development Storage**: In-memory storage implementation for rapid prototyping
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

### Authentication and Authorization
Currently implements a basic user management system with:

- **User Schema**: Simple username/password based authentication structure
- **Session Management**: Prepared for PostgreSQL session storage via connect-pg-simple
- **Storage Interface**: Abstracted storage layer supporting both memory and database implementations

### Component Structure
The application is organized into logical feature-based components:

- **Layout Components**: Navbar, Footer with responsive design and scroll effects
- **Content Sections**: Hero, Problem-Solution, Features, Prototype, Impact, Contact
- **Interactive Elements**: Form handling with validation, animated counters, smooth scrolling navigation
- **UI Components**: Comprehensive shadcn/ui component library with consistent theming

### Design System
Implements a cohesive forest-themed design system:

- **Color Palette**: Earth tones with green primary colors, beige backgrounds, and soft browns
- **Typography**: Multi-font system with Inter for body text and Space Grotesk for headings
- **Animation Strategy**: Subtle professional animations including fade-ins, slide effects, hover interactions, and scroll reveals
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts

## External Dependencies

### Core Frontend Libraries
- **React Ecosystem**: React 18, React DOM, React Hook Form with Zod resolvers
- **UI Components**: Radix UI primitives for accessible components, Lucide React for icons
- **Styling**: TailwindCSS, class-variance-authority for component variants, clsx for conditional classes
- **Animation**: Framer Motion for complex animations, AOS for scroll animations
- **State Management**: TanStack React Query for server state, Zustand-like patterns with custom hooks

### Backend Dependencies
- **Server Framework**: Express.js with CORS and middleware support
- **Database**: Drizzle ORM, @neondatabase/serverless for PostgreSQL connection
- **Validation**: Zod for schema validation and type inference
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite with React plugin and runtime error overlay
- **TypeScript**: Full type safety across client, server, and shared schemas
- **Code Quality**: ESLint configuration, PostCSS for CSS processing
- **Development Environment**: Replit integration with development banner and cartographer plugin

### Third-Party Services
- **Database Hosting**: Neon Database for serverless PostgreSQL
- **Font Loading**: Google Fonts CDN for typography
- **Icon Library**: Font Awesome CDN for iconography
- **Animation Library**: AOS CDN for scroll animations
- **Deployment**: Configured for cloud deployment with environment variable support

### Session and Storage
- **Session Store**: connect-pg-simple for PostgreSQL-backed sessions
- **File Handling**: Attached assets for project documentation and resources
- **Development Storage**: In-memory storage abstraction for rapid iteration