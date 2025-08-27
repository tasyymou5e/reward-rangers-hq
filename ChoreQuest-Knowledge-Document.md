# ChoreQuest - Comprehensive Knowledge Document

**Last Updated:** December 2024  
**Project Type:** Gamified Family Chore Management System  
**Technology Stack:** React + TypeScript + Supabase + Tailwind CSS

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [User Roles & Authentication](#user-roles--authentication)
4. [Database Schema & Security](#database-schema--security)
5. [Component Architecture](#component-architecture)
6. [Custom Hooks](#custom-hooks)
7. [Pages & Routing](#pages--routing)
8. [Design System](#design-system)
9. [Edge Functions](#edge-functions)
10. [Security Implementation](#security-implementation)
11. [Recent Security Updates](#recent-security-updates)
12. [Admin Features](#admin-features)
13. [Development Guidelines](#development-guidelines)

---

## Project Overview

ChoreQuest is a comprehensive family chore management application that gamifies household tasks for children while providing robust management tools for parents and comprehensive oversight for administrators.

### Core Features

- **Gamified Chore System**: Point-based rewards, badges, streaks, and levels
- **Family Management**: Multi-child family support with secure role-based access
- **Wishlist System**: Kids can create wishlists tied to point goals
- **Real-time Chat**: Family communication system
- **Analytics & Insights**: Predictive analytics for chore completion
- **Admin Portal**: Comprehensive system administration with user/family deletion
- **Security**: MFA, rate limiting, comprehensive audit logging

---

## Architecture & Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling with custom design system
- **React Router** for client-side routing
- **Shadcn/ui** component library
- **Lucide React** for icons

### Backend & Database
- **Supabase** for backend services
- **PostgreSQL** database with Row Level Security (RLS)
- **Edge Functions** for custom backend logic
- **Real-time subscriptions** for live updates

### Key Libraries
- **React Hook Form** + **Zod** for form validation
- **React Query/TanStack Query** for data fetching
- **Date-fns** for date manipulation
- **jsPDF** for report generation
- **Recharts** for analytics visualization

---

## User Roles & Authentication

### Role Hierarchy

1. **Admin**
   - Full system access
   - User and family management with deletion capabilities
   - Security monitoring
   - A/B testing management
   - Analytics oversight

2. **Parent**
   - Family creation and management
   - Child account management
   - Chore assignment and approval
   - Wishlist approval
   - Report generation

3. **Kid**
   - Chore completion
   - Point earning and tracking
   - Wishlist management
   - Mini-games and motivation tools

### Authentication Features

- **Email/Password** authentication via Supabase Auth
- **Multi-Factor Authentication (MFA)** with TOTP
- **Rate limiting** for login attempts
- **Session management** with auto-refresh
- **Secure password generation** for invited users

---

## Database Schema & Security

### Core Tables

#### Users & Profiles
- `profiles` - Extended user information beyond auth.users
- `user_mfa_settings` - MFA configuration per user
- `families` - Family groups with unique codes
- `family_members` - Many-to-many relationship between users and families

#### Chores & Progress
- `chores` - Task definitions with points, difficulty, due dates
- `progress_logs` - Completion tracking and point allocation
- `chore_analytics` - Performance metrics and preferences

#### Rewards & Gamification
- `badges` - Achievement definitions
- `user_badges` - Badge awards per user
- `rewards` - Family-specific reward catalog
- `wishlist_items` - User goal items with point targets

#### Communication & Analytics
- `family_messages` - Encrypted chat system
- `motivation_journal` - Reflection entries
- `family_reports` - Generated PDF reports
- `ab_tests` - A/B testing framework
- `user_feedback` - User-submitted feedback

#### Security & Monitoring
- `security_alerts` - System security events
- `auth_rate_limits` - Login attempt tracking
- `mfa_audit_log` - MFA event logging

### Row Level Security (RLS)

All tables implement comprehensive RLS policies:
- **Family-based isolation**: Users only access their family's data
- **Role-based permissions**: Different access levels per user role
- **Admin override**: Admins can access all data for management
- **Security functions**: Dedicated functions prevent RLS recursion

---

## Component Architecture

### Core Components

#### Authentication & Protection
- `ProtectedRoute.tsx` - Role-based route protection
- `AdminProtectedRoute.tsx` - Admin-specific route guard
- `MFASetup.tsx` - Multi-factor authentication setup

#### Layout & Navigation
- `Header.tsx` - Role-adaptive header component
- `PortalCard.tsx` - Dashboard navigation cards

#### Chore Management
- `ChoreCard.tsx` - Individual chore display
- `ChoreAssignmentForm.tsx` - Bulk chore assignment
- `ChoreTimer.tsx` - Task timing functionality
- `ConfettiEffect.tsx` - Completion celebration

#### Wishlist & Rewards
- `WishlistForm.tsx` - Basic wishlist item creation
- `EnhancedWishlistForm.tsx` - Advanced form with affiliate integration
- `WishlistCard.tsx` - Wishlist item display
- `RewardBadge.tsx` - Achievement visualization

#### Family & Communication
- `AddChildForm.tsx` - Child invitation system
- `FamilyChat.tsx` - Real-time messaging
- `MotivationJournal.tsx` - Reflection tool

#### Admin & Management
- `UserManagementTab.tsx` - User creation and deletion functionality
- `AffiliateManagement.tsx` - Partner store management
- `FeedbackWidget.tsx` - User feedback collection
- `PredictiveInsights.tsx` - Analytics dashboard

#### Games & Engagement
- `MiniGames.tsx` - Chore completion games (puzzle, memory, colors)

### UI Components (Shadcn/ui)
Complete set of accessible, customizable components including:
- Forms, inputs, buttons, dialogs
- Tables, cards, tabs, navigation
- Charts, calendars, date pickers
- Alerts, toasts, tooltips

---

## Custom Hooks

### Data Management Hooks

#### `useAuth()` - Authentication Context
```typescript
// Current user, profile, and authentication state
const { user, profile, loading, signIn, signOut, signUp } = useAuth();
```

#### `useAdmin()` - Administrative Operations
```typescript
// User and family management, analytics, badge management
const { 
  fetchAllUsers, fetchAllFamilies, deleteUser, deleteFamily,
  createUser, createTestFamily, getAnalytics, createBadge 
} = useAdmin();
```

#### `useFamily()` - Family Data Management
```typescript
// Family information and member management
const { family, familyMembers, joinFamily, createFamily } = useFamily();
```

#### `useChores()` - Chore Operations
```typescript
// Chore CRUD operations and completion tracking
const { chores, completeChore, createChore, updateChore } = useChores();
```

#### `useWishlist()` - Wishlist Management
```typescript
// Wishlist item management and approval workflow
const { wishlistItems, addWishlistItem, approveWishlistItem } = useWishlist();
```

### Specialized Hooks

#### `useSecurityMonitoring()` - Security Operations
```typescript
// Security alert management and monitoring
const { alerts, resolveAlert, fetchAlerts } = useSecurityMonitoring();
```

#### `useABTesting()` - Experiment Management
```typescript
// A/B test assignment and result tracking
const { getVariant, createTest, getTestResults } = useABTesting();
```

#### `usePredictiveAnalytics()` - AI Insights
```typescript
// Chore completion predictions and suggestions
const { suggestions, analytics, generateSuggestions } = usePredictiveAnalytics();
```

#### `useReportGeneration()` - PDF Reports
```typescript
// Automated family report generation
const { generateWeeklyReport, generating } = useReportGeneration();
```

#### `useFamilyChat()` - Real-time Messaging
```typescript
// Family communication system
const { messages, sendMessage, loading } = useFamilyChat();
```

#### `useAffiliates()` - Partner Integration
```typescript
// Affiliate store management
const { affiliates, fetchAffiliates } = useAffiliates();
```

---

## Pages & Routing

### Main Application Pages

#### `Index.tsx` - Landing Page
- Role-based portal selection
- Authentication state handling
- Portal navigation cards

#### `Auth.tsx` - Authentication
- Sign in/up forms
- Role selection for registration
- Admin portal link

#### `AdminAuth.tsx` - Admin Authentication
- Secure admin login
- Enhanced security messaging
- Navigation back to main auth

### Portal Pages

#### `KidsPortal.tsx` - Children's Interface
- Chore list with completion tracking
- Point and level display
- Wishlist management
- Mini-games integration
- Badge collection display

#### `ParentsPortal.tsx` - Parent Dashboard
- Family member overview
- Chore assignment and monitoring
- Wishlist approval workflow
- Report generation
- MFA setup

#### `AdminPortal.tsx` - Administrative Interface
- User and family management
- Security monitoring
- A/B testing dashboard
- System analytics
- Affiliate management
- Feedback review

### Error Handling
#### `NotFound.tsx` - 404 Error Page
- User-friendly error message
- Navigation back to appropriate portal

---

## Design System

### Color Schemes

#### Kids Theme (Bright & Playful)
- **Primary**: Purple (`hsl(268, 76%, 62%)`)
- **Secondary**: Teal (`hsl(172, 76%, 55%)`)
- **Accent**: Yellow (`hsl(45, 93%, 58%)`)
- **Success**: Green (`hsl(142, 71%, 45%)`)

#### Parents Theme (Calm & Professional)
- **Primary**: Green (`hsl(142, 71%, 45%)`)
- **Secondary**: Blue (`hsl(200, 98%, 39%)`)
- **Accent**: Orange (`hsl(39, 84%, 56%)`)

#### Admin Theme (Professional)
- **Primary**: Dark Blue (`hsl(215, 28%, 17%)`)
- **Secondary**: Light Gray (`hsl(210, 40%, 96%)`)
- **Accent**: Blue (`hsl(221, 83%, 53%)`)

### Design Tokens

All colors use HSL format and CSS custom properties:
```css
:root {
  --kids-primary: 268 76% 62%;
  --parents-primary: 142 71% 45%;
  --admin-primary: 215 28% 17%;
}
```

### Animations & Effects
- **Bounce-in**: Welcome animations
- **Float**: Subtle hover effects
- **Pulse-glow**: Achievement highlights
- **Smooth transitions**: Enhanced UX

### Typography & Spacing
- Consistent spacing scale
- Responsive typography
- Accessibility-focused design
- Role-appropriate styling

---

## Edge Functions

### User Management Functions

#### `create-user` - User Creation
- Admin-only user creation
- Role assignment
- Profile setup automation
- Error handling and validation

#### `invite-child` - Child Invitation
- Secure child account creation
- Family association
- Automated password generation
- Parent notification

#### `create-test-family` - Test Data Generation
- Complete family setup
- Sample chore creation
- User account generation
- Development/testing support

#### `security-monitor` - Security Monitoring
- Threat detection
- Alert generation
- Audit logging
- Automated responses

### Security Features
- **CORS enabled** for web app integration
- **JWT verification** where required
- **Rate limiting** for API protection
- **Comprehensive logging** for audit trails

---

## Security Implementation

### Authentication Security
- **Supabase Auth** with enterprise-grade security
- **MFA Support** with TOTP backup codes
- **Rate limiting** prevents brute force attacks
- **Session management** with secure tokens

### Database Security
- **Row Level Security (RLS)** on all tables
- **Security DEFINER functions** prevent RLS recursion
- **Input validation** at database level
- **Audit logging** for sensitive operations

### Application Security
- **Role-based access control** throughout UI
- **Protected routes** with authentication checks
- **Input sanitization** in forms
- **Secure password generation** for system accounts

### Monitoring & Alerts
- **Security alert system** for threat detection
- **Audit logs** for compliance
- **Rate limit monitoring** for abuse prevention
- **Admin notification system** for critical events

---

## Recent Security Updates

### Database Security Enhancements (December 2024)

1. **Fixed Security DEFINER Functions**
   - Added `SET search_path TO 'public'` to all security definer functions
   - Prevents malicious schema manipulation attacks
   - Ensures predictable function execution context

2. **Enhanced Affiliate Security**
   - Restricted affiliate data access to family members only
   - Removed API key exposure from client-side code
   - Added comprehensive RLS policies for approved_affiliates table

3. **Badge System Security**
   - Limited badge visibility to family members only
   - Removed public access to badge system
   - Added proper authorization checks

4. **Rate Limiting Implementation**
   - Added auth_rate_limits table with IP and email tracking
   - Implemented check_auth_rate_limit_secure function
   - Configurable attempt limits and block durations

5. **Removed Debug Information**
   - Eliminated console.log statements in production code
   - Cleaned up development debugging artifacts
   - Reduced information leakage potential

### Security Functions Added

```sql
-- Secure rate limiting with audit logging
CREATE FUNCTION check_auth_rate_limit_secure(
  ip_addr inet, 
  email_addr text, 
  max_attempts integer DEFAULT 5, 
  block_duration_minutes integer DEFAULT 15
) RETURNS boolean

-- Security monitoring for table access
CREATE FUNCTION log_security_table_access() RETURNS trigger

-- Security definer function auditing
CREATE FUNCTION audit_security_definer_usage() 
RETURNS TABLE(function_name text, security_level text, recommendation text)
```

---

## Admin Features

### User Management
The admin portal provides comprehensive user and family management capabilities:

#### Individual User Management
- **Create Users**: Admin can create individual users with specific roles (admin, parent, kid)
- **Delete Users**: Single user deletion with confirmation dialogs
- **User Overview**: Table view of all users with role information
- **Role Management**: Assign appropriate roles during user creation

#### Family Management
- **Create Test Families**: Complete family setup with parent and multiple children
- **Delete Families**: Remove entire families including all members and associated data
- **Family Overview**: Table view showing family names and member counts
- **Bulk Operations**: Family deletion removes all associated users and data

#### Security Features
- **Confirmation Dialogs**: All deletion operations require explicit confirmation
- **Cascade Deletions**: Family deletion properly removes all related data
- **Audit Logging**: All admin actions are logged for security monitoring
- **Role Restrictions**: Only admin users can access management functions

#### User Creation Process
1. **Individual Users**: Email, password, display name, and role selection
2. **Test Families**: Family name, parent account, and multiple children accounts
3. **Automated Setup**: Profiles, permissions, and relationships created automatically
4. **Security Integration**: MFA support and proper RLS policy application

### Analytics & Monitoring
- **System Analytics**: User counts, family statistics, chore completion rates
- **Security Monitoring**: Real-time security alerts and resolution tools
- **A/B Testing**: Experiment management and results tracking
- **Feedback Management**: User feedback review and response system

---

## Development Guidelines

### Code Organization
- **Component-based architecture** with single responsibility
- **Custom hooks** for business logic separation
- **TypeScript** for type safety
- **Consistent naming conventions** across codebase

### Security Best Practices
- **Never expose API keys** in client code
- **Always use RLS policies** for data access
- **Validate inputs** at both client and server
- **Log security events** for audit trails

### Performance Optimization
- **React Query** for efficient data fetching
- **Lazy loading** for route splitting
- **Optimized re-renders** with proper dependencies
- **Database indexing** for query performance

### Testing Strategy
- **Type safety** through TypeScript
- **User testing** through admin portal test family creation
- **Security testing** through admin monitoring tools
- **Performance monitoring** through analytics

### Deployment & Monitoring
- **Supabase hosting** for automatic scaling
- **Real-time monitoring** through admin portal
- **Error tracking** through security alerts
- **Performance analytics** through built-in metrics

---

## File Structure Overview

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── *Form.tsx       # Form components
│   ├── *Card.tsx       # Display components
│   └── *Management*.tsx # Admin management components
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── AdminAuthContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.ts
│   ├── useAdmin.ts     # Admin operations including delete functions
│   ├── useFamily.ts
│   ├── useChores.ts
│   └── use*.ts         # Feature-specific hooks
├── pages/              # Route components
│   ├── Index.tsx
│   ├── Auth.tsx
│   ├── AdminAuth.tsx
│   ├── KidsPortal.tsx
│   ├── ParentsPortal.tsx
│   └── AdminPortal.tsx # Comprehensive admin interface
├── utils/              # Utility functions
│   └── securePasswordGenerator.ts # Secure password generation
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Library configurations
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge functions
│   ├── create-user/
│   ├── invite-child/
│   ├── create-test-family/
│   └── security-monitor/
└── config.toml        # Supabase configuration
```

---

This knowledge document provides comprehensive coverage of the ChoreQuest application architecture, security implementation, admin features, and development guidelines. It includes the latest updates for user and family deletion capabilities in the admin portal.