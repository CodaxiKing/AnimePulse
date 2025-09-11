# AnimePulse

## Overview

AnimePulse is a modern anime and manga discovery platform built with React, Express.js, and TypeScript. The application features a dark theme with neon purple/pink accents, providing users with a comprehensive platform to browse trending anime, continue watching series, explore manga categories, read anime news, and engage with the community through social features.

The platform integrates with external anime APIs (HiAnime, AniNews, MangaHook) while providing fallback mock data to ensure a seamless user experience. The application supports user authentication, progress tracking, and social interactions within the anime community.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with support for dynamic routes
- **Styling**: TailwindCSS with a custom dark theme and CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation through Hookform resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proper error handling and request logging middleware
- **Development**: Vite development server with HMR (Hot Module Replacement)
- **Production**: esbuild bundling for optimized server builds

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless connection with environment-based configuration
- **Fallback Storage**: In-memory storage implementation for development and fallback scenarios

### UI/UX Design System
- **Color Scheme**: Dark theme with custom CSS variables for consistent theming
- **Typography**: Inter font family for modern, readable text
- **Component Architecture**: Modular component structure with reusable UI primitives
- **Responsive Design**: Mobile-first responsive design with Tailwind's responsive utilities
- **Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation

### Authentication & User Management
- **User Schema**: Drizzle-defined user models with username/password authentication
- **Session Management**: Built-in session handling with user state management
- **User Features**: Avatar support, online status tracking, and last activity timestamps

## External Dependencies

### Third-Party APIs
- **Jikan API**: API principal para dados de anime e manga (acesso não oficial ao MyAnimeList via https://api.jikan.moe/v4)
- **Anime News Network**: Integração RSS para notícias reais de anime e manga
- **YouTube Data API**: Sistema de trailers oficiais integrado para preview de animes
- **Anime Scraper API**: Sistema de web scraping independente hospedado separadamente para streaming de episódios

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment-configured connection string for secure database access

### Development Tools
- **Replit Integration**: Vite plugin for Replit development environment with cartographer support
- **Error Handling**: Runtime error overlay for development debugging

### UI Libraries & Frameworks
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with custom configuration
- **Date-fns**: Date manipulation library with internationalization support

### Build & Development Dependencies
- **Vite**: Fast build tool and development server
- **esbuild**: JavaScript bundler for production builds
- **TypeScript**: Type checking and compilation
- **Drizzle ORM**: Type-safe database operations and migrations

### Fonts & Assets
- **Google Fonts**: Inter font family for typography
- **Unsplash**: Placeholder images for anime/manga content during development