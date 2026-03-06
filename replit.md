# replit.md

## Overview

This is a full-stack TypeScript application featuring a React frontend and Express backend. The project appears to be a chart generator tool (TestDino) that allows users to create customizable bar charts and export them as images. The application uses a modern monorepo-style structure with shared code between client and server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (supports light/dark mode)
- **Build Tool**: Vite with React plugin
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- Utility functions in `client/src/lib/`

### Backend Architecture
- **Framework**: Express 5 (latest version)
- **Runtime**: Node.js with tsx for TypeScript execution
- **API Pattern**: RESTful routes prefixed with `/api`
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL storage

The server structure includes:
- `server/index.ts`: Main entry point with middleware setup
- `server/routes.ts`: API route registration
- `server/storage.ts`: Data access layer with interface abstraction
- `server/vite.ts`: Development server integration with Vite HMR
- `server/static.ts`: Production static file serving

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with migrations output to `./migrations`
- **Validation**: Drizzle-Zod for generating Zod schemas from database tables

The storage layer uses an interface pattern (`IStorage`) allowing for swappable implementations:
- `MemStorage`: In-memory storage for development/testing
- Database storage can be implemented using the same interface

### Build System
- **Development**: `npm run dev` - Uses tsx to run TypeScript directly with Vite middleware
- **Production Build**: `npm run build` - Custom build script using esbuild for server and Vite for client
- **Type Checking**: `npm run check` - TypeScript compilation without emit
- **Database Sync**: `npm run db:push` - Push schema changes to database

Path aliases configured:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Database
- **PostgreSQL**: Required for production (DATABASE_URL environment variable)
- **Drizzle ORM**: Database toolkit for queries and migrations
- **connect-pg-simple**: PostgreSQL session store for Express

### UI/Visualization
- **Radix UI**: Headless component primitives (dialogs, dropdowns, etc.)
- **Recharts**: Charting library (used in some chart types)
- **html-to-image**: Converting DOM elements to images (toPng, toSvg functions)
- **Custom SVG charts**: Area chart and Line chart use custom SVG rendering with Catmull-Rom spline interpolation (no Recharts)
- **embla-carousel-react**: Carousel component
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type safety across the stack

### Utilities
- **date-fns**: Date manipulation
- **clsx/tailwind-merge**: Class name utilities
- **Zod**: Schema validation
- **nanoid**: ID generation