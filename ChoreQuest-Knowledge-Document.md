# ChoreQuest - Project Knowledge Document

## Project Overview
ChoreQuest is a comprehensive family chore management and gamification platform built with React, TypeScript, Tailwind CSS, and Supabase. The application features role-based access for kids, parents, and administrators, with a focus on gamifying household tasks to motivate children.

## Architecture Overview

### Frontend Stack
- **React 18** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** with custom design system
- **React Router** with HashRouter for navigation
- **TanStack Query** for data fetching and caching
- **Radix UI** components with shadcn/ui styling

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Auth** for authentication
- **Supabase Edge Functions** for serverless functions
- **Supabase Real-time** for live updates

## User Roles & Access Control

### 1. Kids (kid role)
- View and complete assigned chores
- Track progress and earn points
- Create and manage wishlist items
- Play mini-games
- Write motivation journal entries
- Chat with family members
- View family affiliates/stores

### 2. Parents (parent role)
- Create and assign chores to children
- Approve/reject wishlist items
- Invite children to family
- Generate family reports
- Monitor child progress
- Set up MFA security
- Access predictive insights
- Manage family chat
- View family affiliates/stores

### 3. Administrators (admin role)
- Manage all users and families
- Access analytics dashboard
- Manage security alerts
- Create and manage badges
- A/B testing management
- User feedback management
- Affiliate management
- System security monitoring

## Key Components & Features

### Core Components
- **PortalCard**: Main navigation cards for different sections
- **ChoreCard**: Individual chore display and interaction
- **ChoreTimer**: Pomodoro-style timer for chore completion
- **WishlistCard**: Display wishlist items with approval workflow
- **RewardBadge**: Achievement system display
- **MiniGames**: Educational games for kids
- **ConfettiEffect**: Celebration animations
- **FamilyChat**: Real-time family messaging
- **MotivationJournal**: Reflection and goal-setting tool

### Specialized Components
- **MFASetup**: Multi-factor authentication configuration
- **PredictiveInsights**: AI-powered analytics and suggestions
- **AffiliateDisplay**: Partner store integration
- **AffiliateManagement**: Admin affiliate management
- **UserManagementTab**: Admin user control panel
- **FeedbackWidget**: User feedback collection

## Design System

### Color Themes
- **Kids Theme**: Bright, playful colors (purple, teal, yellow)
- **Parents Theme**: Calm, professional colors (green, blue, gold)
- **Admin Theme**: Professional, authoritative colors (dark blue, gray)

### Design Tokens
- All colors use HSL values with CSS custom properties
- Semantic color naming (primary, secondary, accent, success)
- Role-specific color schemes
- Gradients and shadows for visual depth
- Consistent spacing and typography

### Animation System
- Bounce-in animations for gamification
- Float animations for interactive elements
- Pulse-glow effects for achievements
- Smooth transitions with cubic-bezier timing

## Database Schema

### Core Tables
- **profiles**: User information and roles
- **families**: Family groups with parent ownership
- **family_members**: Family membership relationships
- **chores**: Task management with status tracking
- **wishlist_items**: Reward goals with approval workflow
- **progress_logs**: Activity tracking and points
- **rewards**: Family reward system
- **badges**: Achievement system

### Security Tables
- **security_alerts**: Security event monitoring
- **auth_rate_limits**: Login attempt tracking
- **user_mfa_settings**: Multi-factor authentication
- **mfa_audit_log**: Security audit trail

### Feature Tables
- **family_messages**: Real-time chat system
- **motivation_journal**: Reflection entries
- **chore_analytics**: Performance tracking
- **user_feedback**: Feature requests and bugs
- **ab_tests**: A/B testing framework
- **approved_affiliates**: Partner store management

## Security Implementation

### Authentication & Authorization
- Supabase Auth with email/password
- Row Level Security (RLS) policies on all tables
- Role-based access control (RBAC)
- Multi-factor authentication (MFA) support
- Session management and token refresh

### Security Monitoring
- Real-time security alert system
- Rate limiting for authentication attempts
- IP-based access tracking
- Security event logging
- Admin security dashboard

### Data Protection
- Family-scoped data access
- Encrypted sensitive data storage
- Input validation and sanitization
- SQL injection prevention
- Cross-site scripting (XSS) protection

## Custom Hooks

### Authentication Hooks
- **useAuth**: Main authentication context
- **useAdminAuth**: Separate admin authentication
- **useSecurityMonitoring**: Security event tracking

### Data Management Hooks
- **useFamily**: Family data and relationships
- **useChores**: Chore management and completion
- **useWishlist**: Wishlist item management
- **useFamilyChat**: Real-time messaging
- **useAffiliates**: Partner store management

### Feature Hooks
- **useABTesting**: A/B test variant assignment
- **usePredictiveAnalytics**: AI insights generation
- **useReportGeneration**: PDF report creation
- **useAdmin**: Administrative functions

## Edge Functions

### create-user
- Creates new users with role assignment
- Admin-only access with validation
- Automatic profile creation trigger
- Error handling and cleanup

### invite-child
- Parent invites children to family
- Secure password generation
- Email invitation with credentials
- Family membership management

### security-monitor
- Real-time security event processing
- Rate limiting enforcement
- Alert generation and notification
- IP tracking and analysis

## Development Guidelines

### Code Organization
- Feature-based component organization
- Consistent naming conventions
- TypeScript for type safety
- Custom hooks for business logic
- Reusable UI components

### Security Best Practices
- Never expose sensitive data in console logs
- Use cryptographically secure random generation
- Implement proper error handling
- Validate all user inputs
- Follow principle of least privilege

### Performance Optimization
- React Query for efficient data fetching
- Component memoization where appropriate
- Lazy loading for routes and components
- Image optimization and caching
- Database query optimization

### Testing Strategy
- Component unit testing
- Integration testing for user flows
- Security testing for vulnerabilities
- Performance testing for scalability
- User acceptance testing

## Deployment & Configuration

### Environment Setup
- Supabase project configuration
- Environment variables management
- Database migration system
- Edge function deployment
- Real-time configuration

### Production Considerations
- Error boundary implementation
- Graceful error handling
- Performance monitoring
- Security alert notifications
- Backup and recovery procedures

## Future Enhancements

### Planned Features
- Mobile app development
- Advanced analytics dashboard
- Third-party integrations
- Enhanced gamification
- AI-powered recommendations

### Scalability Considerations
- Microservice architecture
- CDN implementation
- Database sharding
- Load balancing
- Caching strategies

## Troubleshooting

### Common Issues
- Authentication session persistence
- RLS policy conflicts
- Real-time subscription management
- File upload limitations
- Performance bottlenecks

### Debug Tools
- Console logging (development only)
- Network request monitoring
- Database query analysis
- Security alert tracking
- User feedback collection

## API Documentation

### Supabase Integration
- Authentication endpoints
- Database table access
- Real-time subscriptions
- Edge function invocation
- File storage operations

### External Integrations
- Email service (Resend)
- Affiliate partner APIs
- Analytics tracking
- Payment processing (future)
- Third-party services

---

## Code Style & Conventions

### Component Structure
```typescript
// Component props interface
interface ComponentProps {
  // Props definition
}

// Main component function
export function Component({ props }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Functions
  // Render
}
```

### Hook Structure
```typescript
export function useFeature() {
  // State management
  // Data fetching
  // Business logic
  // Return interface
}
```

### Naming Conventions
- PascalCase for components and types
- camelCase for functions and variables
- kebab-case for file names
- UPPER_CASE for constants
- Descriptive names for clarity

This knowledge document should be regularly updated as the project evolves and new features are added.