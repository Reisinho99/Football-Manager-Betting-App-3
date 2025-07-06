# replit.md

## Overview

This is a full-stack sports betting application built with React, Express.js, and PostgreSQL. The application supports both traditional football leagues and eSports tournaments, featuring a modern sportsbook interface with real-time betting capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for betting slip state, React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses

### Database Schema
The application uses a relational database with the following main entities:
- **Users**: Store user accounts with balance tracking
- **Leagues**: Organize teams by geographical regions and competitions
- **Teams**: Football teams and eSports organizations
- **Matches**: Scheduled games with scores and status tracking
- **Markets**: Betting options for each match (1/X/2, Over/Under, etc.)
- **Bets**: User wagers with multiple selections support
- **Bet Selections**: Individual picks within accumulator bets

## Key Components

### Betting System
- **Betting Slip**: Persistent state management using Zustand
- **Market Types**: Support for various betting markets (1/X/2, Over/Under, Draw No Bet)
- **Accumulator Bets**: Multiple selections with calculated total odds
- **Balance Management**: Real-time balance updates and validation

### Match Management
- **Custom Matches**: Admin can create custom matches with flexible team selection
- **Real-time Updates**: Live score updates and match status changes
- **Multi-sport Support**: Football leagues and eSports tournaments
- **Market Locking**: Prevent bets on locked markets

### User Interface
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Theme System**: Professional green theme with light/dark mode support
- **Component Library**: Extensive use of Radix UI primitives
- **Navigation**: Sidebar navigation with collapsible country/league structure

## Data Flow

1. **Initial Load**: Client fetches matches, leagues, and user balance
2. **Betting Flow**: User selects markets → adds to betting slip → places bet → balance updates
3. **Match Updates**: Admin updates scores → market resolution → bet settlement
4. **Real-time Sync**: React Query handles cache invalidation and re-fetching

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **UI Components**: @radix-ui/* for accessible component primitives
- **State Management**: zustand for client state, @tanstack/react-query for server state
- **Styling**: tailwindcss with class-variance-authority for component variants

### Development Tools
- **Build**: Vite with React plugin
- **Type Checking**: TypeScript with strict mode
- **Development**: tsx for TypeScript execution
- **Theme**: @replit/vite-plugin-shadcn-theme-json for theme customization

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build both frontend and backend for production
- `npm run start`: Start production server
- `npm run db:push`: Apply database schema changes

## Changelog

Changelog:
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.