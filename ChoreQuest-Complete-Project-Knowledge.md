# ChoreQuest - Complete Project Knowledge

## Project Overview

ChoreQuest is a comprehensive family chore management application built with React, TypeScript, and Supabase. It gamifies household tasks to encourage children's participation while providing parents with tools to track progress and manage family activities.

## Architecture & Technology Stack

### Frontend Stack
- **React 18.3.1** - Core UI framework
- **TypeScript** - Type safety and enhanced development experience
- **Vite** - Build tool and development server
- **React Router DOM 6.30.1** - Client-side routing with hash-based navigation
- **TanStack React Query 5.83.0** - Server state management and caching

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Shadcn/ui Components** - Comprehensive UI component library built on Radix UI primitives
- **Radix UI** - Headless UI components for accessibility
- **Lucide React 0.462.0** - Icon library
- **Next Themes 0.3.0** - Dark/light mode support

### Backend & Database
- **Supabase** - Backend-as-a-Service platform providing:
  - PostgreSQL database with real-time subscriptions
  - Row Level Security (RLS) for data protection
  - Authentication and user management
  - Edge functions for custom business logic
  - File storage capabilities

### Charts & Analytics
- **Recharts 2.15.4** - Data visualization library
- **jsPDF 3.0.2 & jspdf-autotable 5.0.2** - PDF generation for reports

### Form Management
- **React Hook Form 7.61.1** - Performance-focused form library
- **Zod 3.25.76** - TypeScript-first schema validation
- **@hookform/resolvers 3.10.0** - Validation resolver for React Hook Form

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn UI components
│   ├── analytics/       # Analytics dashboard components
│   └── [feature].tsx    # Feature-specific components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── pages/               # Route components
├── utils/               # Utility functions
├── integrations/        # External service integrations
│   └── supabase/        # Supabase configuration and types
└── lib/                 # Shared libraries and utilities
```

## User Roles & Authentication

### Role-Based Access Control
The application supports four primary user roles:

1. **Kids** (`kid`)
   - View assigned chores
   - Complete tasks and earn points
   - Access mini-games and motivation journal
   - Create wishlist items

2. **Parents** (`parent`)
   - Create and assign chores
   - Monitor children's progress
   - Manage family members
   - Approve wishlist items and rewards

3. **Admin** (`admin`)
   - Full system access
   - User and family management
   - Analytics dashboard
   - A/B testing management
   - Security monitoring

4. **Unauthenticated Users**
   - Landing page access only
   - Authentication flows

### Authentication Flow
- **Dual Authentication System**:
  - Standard user authentication for families (kids/parents)
  - Separate admin authentication for administrative access
- **Protected Routes**: Role-based route protection with automatic redirects
- **Session Management**: Persistent sessions with automatic token refresh

## Core Features & Components

### Family Management
- **Family Creation**: Parents can create families with unique family codes
- **Child Invitation**: Secure invitation system for adding children
- **Family Chat**: Real-time messaging system for family communication
- **Family Analytics**: Progress tracking and engagement metrics

### Chore System
- **Chore Templates**: Admin-managed default chore templates with categories and difficulty levels
- **Chore Assignment**: Flexible assignment to individual children or all family members
- **Status Tracking**: Pending → In Progress → Completed workflow
- **Point System**: Configurable point values for different tasks
- **Timer Integration**: Built-in timers for time-sensitive tasks
- **Progress Logging**: Detailed activity tracking and analytics
- **Template Management**: Comprehensive admin interface for creating and managing chore templates

### Gamification Features
- **Point System**: Points earned for completing chores
- **Levels & Streaks**: User progression and engagement tracking
- **Badges**: Achievement system with custom badge management
- **Mini-Games**: Puzzle, memory, and color games as task rewards
- **Confetti Effects**: Visual celebrations for achievements

### Wishlist & Rewards
- **Wishlist Creation**: Children can create custom wishlist items
- **Affiliate Integration**: Support for external product affiliates
- **Approval Workflow**: Parent approval required for wishlist items
- **Point Goals**: Items tied to point requirements
- **Achievement Tracking**: Progress toward wishlist goals

### Analytics Dashboard (Admin)
- **KPI Cards**: Key performance indicators with real-time data
- **Interactive Charts**:
  - User growth over time
  - Chore completion trends
  - Family engagement metrics
  - System performance monitoring
  - Revenue tracking
  - Conversion rate analysis
- **Data Tables**: Sortable, filterable data views with export functionality
- **Real-time Dashboard**: Live metrics with Supabase real-time subscriptions
- **Export Functionality**: PDF and CSV report generation

## Database Schema & Security

### Core Tables
- `profiles` - User information and preferences
- `families` - Family groups and metadata
- `family_members` - Many-to-many relationship between users and families
- `chores` - Task definitions and assignments
- `chore_templates` - Default chore templates for admin management
- `progress_logs` - Activity tracking and point history
- `wishlist_items` - User-created wishlist entries
- `rewards` - Available rewards and redemption tracking
- `badges` - Achievement definitions
- `user_badges` - User achievement tracking

### Security Features
- **Row Level Security (RLS)**: Comprehensive data access policies
- **Rate Limiting**: Protection against authentication attacks
- **Security Monitoring**: Automated threat detection and alerting
- **MFA Support**: Multi-factor authentication capabilities
- **Audit Logging**: Comprehensive activity tracking

### Database Functions
- User authentication helpers (`is_admin`, `is_family_member`)
- Security utilities (`log_security_event`, `check_auth_rate_limit`)
- Data access functions (`get_safe_family_profiles`)
- Validation and triggers for data integrity

## State Management Patterns

### Context Providers
- **AuthContext**: User authentication and session management
- **AdminAuthContext**: Separate authentication context for admin users

### Custom Hooks
- **useChores**: Chore management and CRUD operations
- **useFamily**: Family-related data and operations
- **useFamilyChat**: Real-time messaging functionality
- **useWishlist**: Wishlist management
- **useAdmin**: Administrative functions and analytics
- **useAnalyticsData**: Comprehensive analytics data fetching
- **useABTesting**: A/B test management and assignment

### Data Fetching Strategy
- React Query for server state management
- Optimistic updates for better UX
- Background refetching and cache invalidation
- Error handling and retry logic

## Design System

### Theme Architecture
- **Multi-theme Support**: Separate color schemes for kids, parents, and admin interfaces
- **CSS Custom Properties**: Semantic color tokens defined in `index.css`
- **Gradient System**: Role-specific gradient backgrounds
- **Animation System**: Consistent timing functions and keyframes

### Component Patterns
- **Shadcn Integration**: Extensive use of customizable UI components
- **Compound Components**: Complex components built from smaller pieces
- **Polymorphic Components**: Flexible component APIs with proper TypeScript support
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Accessibility
- **ARIA Support**: Proper labeling and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG-compliant color combinations
- **Screen Reader Support**: Optimized for assistive technologies

## Development Patterns & Best Practices

### Code Organization
- **Feature-based Structure**: Components grouped by functionality
- **Separation of Concerns**: Clear separation between UI, business logic, and data access
- **Reusable Components**: DRY principles with shared component library
- **Type Safety**: Comprehensive TypeScript coverage

### Performance Optimizations
- **Code Splitting**: Route-based code splitting with React.lazy
- **Memoization**: Strategic use of React.memo and useMemo
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Image Optimization**: Lazy loading and responsive images

### Error Handling
- **Error Boundaries**: Application-level error catching and recovery
- **Form Validation**: Client-side validation with Zod schemas
- **API Error Handling**: Consistent error responses and user feedback
- **Logging**: Comprehensive error logging and monitoring

## Testing & Quality Assurance

### Code Quality Tools
- **ESLint**: Code linting with React-specific rules
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (inferred from project structure)

### Security Measures
- **Environment Variables**: Secure configuration management
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM usage

## Deployment & Infrastructure

### Build Configuration
- **Vite Configuration**: Optimized build settings for production
- **Environment Handling**: Separate configurations for development and production
- **Asset Optimization**: Minification and compression

### Supabase Integration
- **Edge Functions**: Custom business logic deployed to Supabase
- **Real-time Subscriptions**: Live data updates for enhanced UX
- **Database Migrations**: Version-controlled schema changes
- **Backup & Recovery**: Automated backup strategies

## API Integration Patterns

### Supabase Client Usage
- **Singleton Pattern**: Shared Supabase client instance
- **Type Safety**: Generated TypeScript types from database schema
- **Query Optimization**: Efficient data fetching with select projections
- **Real-time Subscriptions**: WebSocket-based live updates

### External APIs
- **Affiliate APIs**: Integration with external product catalogs
- **Email Services**: Notification and communication systems
- **Analytics Services**: Usage tracking and performance monitoring

## Documentation & Knowledge Management

### Code Documentation
- **TypeScript Interfaces**: Self-documenting code through type definitions
- **Component Props**: Comprehensive prop documentation
- **Hook Documentation**: Usage examples and API references

### Project Knowledge Files
- **System Architecture**: High-level system design documentation
- **Analytics Knowledge**: Detailed analytics feature documentation
- **User Roles**: Role-based access control documentation
- **Recent Updates**: Change log and feature additions

## Scalability Considerations

### Database Scalability
- **Indexed Queries**: Optimized database queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: N+1 query prevention and efficient joins

### Application Scalability
- **Component Reusability**: Modular architecture for easy scaling
- **State Management**: Efficient state updates and minimal re-renders
- **Bundle Size**: Optimized imports and code splitting strategies

### Performance Monitoring
- **Real-time Analytics**: Live performance metrics
- **Error Tracking**: Comprehensive error monitoring and alerting
- **User Experience Metrics**: Core Web Vitals and performance indicators

## Future Enhancement Opportunities

### Technical Improvements
- **Progressive Web App**: Enhanced mobile experience with PWA features
- **Offline Support**: Offline-first architecture with sync capabilities
- **Microservices**: Service decomposition for better scalability
- **Advanced Analytics**: Machine learning integration for predictive insights

### Feature Enhancements
- **Social Features**: Family leaderboards and social sharing
- **Integration Ecosystem**: Third-party app integrations
- **Advanced Gamification**: Seasonal events and challenges
- **AI-Powered Insights**: Personalized recommendations and insights

This knowledge document provides a comprehensive overview of the ChoreQuest application, serving as a reference for developers, stakeholders, and future enhancement planning.