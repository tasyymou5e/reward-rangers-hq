# ChoreQuest - Comprehensive Project Knowledge

## Project Overview

ChoreQuest is a gamified family chore management application built with React, TypeScript, and Supabase. It provides separate user experiences for kids, parents, and administrators, featuring a points-based reward system, family communication tools, affiliate management, and comprehensive analytics.

## Technology Stack

### Frontend
- **React 18.3.1** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **React Router DOM** - Client-side routing
- **React Query (TanStack)** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions
  - Real-time subscriptions

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript linting
- **Lovable Tagger** - Code tagging

## Database Schema

### Core Tables

#### profiles
User profile information with role-based access
- `id` (uuid, primary key)
- `username` (text, unique)
- `display_name` (text)
- `email` (text)
- `role` (user_role: kid, parent, admin, full_admin, read_only_admin, report_admin)
- `points` (integer, default: 0)
- `level` (integer, default: 1)
- `streak_days` (integer, default: 0)
- `avatar_url` (text, nullable)
- `last_activity` (timestamp)
- `created_at`, `updated_at` (timestamps)

#### families
Family group management
- `id` (uuid, primary key)
- `name` (text)
- `parent_id` (uuid, references profiles)
- `family_code` (text, unique, auto-generated)
- `created_at`, `updated_at` (timestamps)

#### family_members
Junction table for family membership
- `id` (uuid, primary key)
- `family_id` (uuid, references families)
- `user_id` (uuid, references profiles)
- `joined_at` (timestamp)

#### chores
Task management with gamification
- `id` (uuid, primary key)
- `title` (text)
- `description` (text, nullable)
- `family_id` (uuid, references families)
- `assigned_to` (uuid, references profiles)
- `created_by` (uuid, references profiles)
- `points_value` (integer, default: 10)
- `difficulty` (text: easy, medium, hard)
- `status` (chore_status: pending, in_progress, completed, overdue)
- `estimated_time_minutes` (integer, nullable)
- `due_date` (timestamp, nullable)
- `completed_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

#### rewards
Reward system for earned points
- `id` (uuid, primary key)
- `title` (text)
- `description` (text, nullable)
- `family_id` (uuid, references families)
- `points_cost` (integer)
- `category` (text, default: 'general')
- `status` (reward_status: available, redeemed, expired)
- `created_by` (uuid, references profiles)
- `redeemed_by` (uuid, references profiles, nullable)
- `redeemed_at` (timestamp, nullable)
- `approved_by`, `approved_at` (nullable)
- `created_at`, `updated_at` (timestamps)

#### wishlist_items
Kid-requested items with approval workflow
- `id` (uuid, primary key)
- `title` (text)
- `description` (text, nullable)
- `user_id` (uuid, references profiles)
- `family_id` (uuid, references families)
- `points_goal` (integer)
- `item_type` (text: custom, affiliate)
- `product_url` (text, nullable)
- `product_image_url` (text, nullable)
- `original_price` (numeric, nullable)
- `affiliate_id` (uuid, references approved_affiliates, nullable)
- `status` (text: pending, approved, achieved)
- `approved_by`, `approved_at` (nullable)
- `achieved_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

### Analytics and Tracking

#### chore_analytics
Performance analytics for chores
- `id` (uuid, primary key)
- `family_id` (uuid, references families)
- `child_id` (uuid, references profiles)
- `chore_id` (uuid, references chores)
- `completion_time` (integer, minutes)
- `difficulty_rating` (integer, 1-5)
- `day_of_week` (integer, 0-6)
- `preferred_time_of_day` (text)
- `created_at` (timestamp)

#### progress_logs
Activity logging for tracking user progress
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `family_id` (uuid, references families)
- `chore_id` (uuid, references chores, nullable)
- `action` (text)
- `points_earned` (integer, default: 0)
- `notes` (text, nullable)
- `created_at` (timestamp)

#### motivation_journal
Reflection and motivation tracking
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `family_id` (uuid, references families)
- `chore_id` (uuid, references chores, nullable)
- `task_name` (text)
- `emotion` (text)
- `confidence_level` (integer, 1-10)
- `reflection` (text)
- `what_helped` (text, nullable)
- `next_time` (text, nullable)
- `created_at`, `updated_at` (timestamps)

### Communication

#### family_messages
Real-time family chat system
- `id` (uuid, primary key)
- `family_id` (uuid, references families)
- `user_id` (uuid, references profiles)
- `content` (text)
- `message_type` (text: chat, system, chore_update)
- `parent_message_id` (uuid, self-reference for replies)
- `chore_id` (uuid, references chores, nullable)
- `is_encrypted` (boolean, default: true)
- `created_at`, `updated_at` (timestamps)

### Admin and System

#### approved_affiliates
Affiliate partner management
- `id` (uuid, primary key)
- `name` (text)
- `base_url` (text)
- `custom_url` (text, nullable) - New field for custom display URLs
- `logo_url` (text, nullable)
- `api_key_name` (text, nullable)
- `is_active` (boolean, default: true)
- `created_at`, `updated_at` (timestamps)

#### user_feedback
User feedback and support system
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles, nullable)
- `title` (text)
- `description` (text)
- `type` (text: suggestion, bug, feature_request)
- `category` (text: general, ui, performance, security)
- `status` (text: pending, in_progress, resolved, dismissed)
- `admin_response` (text, nullable)
- `responded_by` (uuid, references profiles, nullable)
- `responded_at` (timestamp, nullable)
- `created_at` (timestamp)

#### security_alerts
Security monitoring and alerts
- `id` (uuid, primary key)
- `alert_type` (text)
- `description` (text)
- `severity` (text: low, medium, high, critical)
- `user_id` (uuid, references profiles, nullable)
- `metadata` (jsonb, default: {})
- `resolved` (boolean, default: false)
- `resolved_by` (uuid, references profiles, nullable)
- `resolved_at` (timestamp, nullable)
- `created_at` (timestamp)

#### A/B Testing

#### ab_tests
A/B test configuration
- `id` (uuid, primary key)
- `name` (text)
- `description` (text, nullable)
- `feature_key` (text)
- `variants` (jsonb, array of variant configurations)
- `target_audience` (jsonb, targeting criteria)
- `active` (boolean, default: true)
- `start_date`, `end_date` (timestamps)
- `created_by` (uuid, references profiles)
- `created_at` (timestamp)

#### ab_test_assignments
User assignments to test variants
- `id` (uuid, primary key)
- `test_id` (uuid, references ab_tests)
- `user_id` (uuid, references profiles)
- `variant` (text)
- `assigned_at` (timestamp)

### Additional Features

#### badges
Achievement system
- `id` (uuid, primary key)
- `name` (text)
- `description` (text, nullable)
- `icon` (text, nullable)
- `points_required` (integer, default: 0)
- `created_at` (timestamp)

#### user_badges
User badge achievements
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `badge_id` (uuid, references badges)
- `earned_at` (timestamp)

#### auth_rate_limits
Authentication rate limiting
- `id` (uuid, primary key)
- `ip_address` (inet)
- `email` (text, nullable)
- `attempt_count` (integer, default: 1)
- `last_attempt` (timestamp)
- `blocked_until` (timestamp, nullable)
- `created_at` (timestamp)

#### user_mfa_settings
Multi-factor authentication
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `mfa_enabled` (boolean, default: false)
- `totp_secret` (text, nullable)
- `backup_codes` (text array, nullable)
- `created_at`, `updated_at` (timestamps)

#### mfa_audit_log
MFA activity logging
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles)
- `action` (text)
- `success` (boolean, default: true)
- `ip_address` (inet, nullable)
- `user_agent` (text, nullable)
- `created_at` (timestamp)

#### family_ai_settings
AI feature configuration per family
- `id` (uuid, primary key)
- `family_id` (uuid, references families)
- `ai_suggestions_enabled` (boolean, default: true)
- `analytics_enabled` (boolean, default: true)
- `data_sharing_consent` (boolean, default: false)
- `created_at`, `updated_at` (timestamps)

#### family_reports
Generated analytics reports
- `id` (uuid, primary key)
- `family_id` (uuid, references families)
- `report_type` (text: weekly, monthly, custom)
- `report_data` (jsonb)
- `report_url` (text, nullable)
- `generated_by` (uuid, references profiles)
- `created_at` (timestamp)

## User Roles and Permissions

### Kid Role
- View and complete assigned chores
- Earn points and track progress
- Create wishlist items
- Participate in family chat
- View own badges and achievements
- Play mini-games
- Use motivation journal

### Parent Role
- Create and assign chores
- Manage family members
- Approve wishlist items
- View family analytics
- Manage rewards
- Moderate family chat
- Generate reports

### Admin Roles
- **admin**: Full system access
- **full_admin**: Complete administrative privileges
- **read_only_admin**: View-only access to admin features
- **report_admin**: Access to analytics and reporting

## Design System

### Theme Structure
The application uses a comprehensive design system with role-based themes:

#### Kids Theme
- Primary: `hsl(268 76% 62%)` (Purple)
- Secondary: `hsl(172 76% 55%)` (Teal)
- Accent: `hsl(45 93% 58%)` (Yellow)
- Background: `hsl(270 50% 98%)` (Light Purple)
- Playful gradients and animations

#### Parents Theme
- Primary: `hsl(142 71% 45%)` (Green)
- Secondary: `hsl(200 98% 39%)` (Blue)
- Accent: `hsl(39 84% 56%)` (Orange)
- Background: `hsl(150 25% 98%)` (Light Green)
- Professional but warm styling

#### Admin Theme
- Primary: `hsl(215 28% 17%)` (Dark Blue)
- Secondary: `hsl(210 40% 96%)` (Light Gray)
- Accent: `hsl(221 83% 53%)` (Bright Blue)
- Background: `hsl(220 13% 97%)` (Light Gray)
- Professional and minimal

### Animation System
- Bounce animations for interactive elements
- Smooth transitions with cubic-bezier easing
- Floating animations for decorative elements
- Pulse-glow effects for achievements

## Architecture

### Component Structure

#### Pages
- `Index.tsx` - Landing page with role selection
- `Auth.tsx` - Authentication page (login/signup)
- `AdminAuth.tsx` - Admin-specific authentication
- `KidsPortal.tsx` - Kids dashboard and features
- `ParentsPortal.tsx` - Parents dashboard and management
- `AdminPortal.tsx` - Administrative interface
- `NotFound.tsx` - 404 error page

#### Core Components

##### Authentication
- `AuthContext.tsx` - Regular user authentication
- `AdminAuthContext.tsx` - Admin authentication
- `ProtectedRoute.tsx` - Route protection for users
- `AdminProtectedRoute.tsx` - Route protection for admins

##### UI Components
- Complete shadcn/ui component library
- Custom themed components for each user type
- Responsive design system

##### Feature Components
- `ChoreCard.tsx` - Chore display and interaction
- `ChoreTimer.tsx` - Task timing functionality
- `RewardBadge.tsx` - Achievement display
- `WishlistCard.tsx` - Wishlist item management
- `FamilyChat.tsx` - Real-time messaging
- `AnalyticsDashboard.tsx` - Data visualization
- `AffiliateDisplay.tsx` - Partner integration
- `FeedbackWidget.tsx` - User feedback collection

### Hooks and Utilities

#### Custom Hooks
- `useAuth.ts` - Authentication state management
- `useAdmin.ts` - Admin functionality
- `useChores.ts` - Chore management
- `useFamily.ts` - Family operations
- `useWishlist.ts` - Wishlist management
- `useAffiliates.ts` - Affiliate operations
- `useAnalyticsData.ts` - Analytics data fetching
- `useFamilyChat.ts` - Chat functionality
- `useABTesting.ts` - A/B testing framework
- `usePredictiveAnalytics.ts` - AI insights
- `useReportGeneration.ts` - Report creation
- `useSecurityMonitoring.ts` - Security tracking

#### Utilities
- `utils.ts` - Common utility functions
- `securePasswordGenerator.ts` - Password generation

### Edge Functions

#### create-user
- Admin-only user creation
- Role assignment
- Email validation
- Security logging

#### invite-child
- Child invitation system
- Family code validation
- Automated account setup

#### security-monitor
- Real-time security monitoring
- Anomaly detection
- Alert generation

### Routing Structure

```
/ - Landing page
/auth - User authentication
/kids - Kids portal (protected, role: kid)
/parents - Parents portal (protected, role: parent)
/admin/auth - Admin authentication
/admin - Admin portal (protected, role: admin)
```

## Security Implementation

### Row Level Security (RLS)
All database tables implement comprehensive RLS policies:

- **Profile Security**: Users can only access their own data and safe family member profiles
- **Family Isolation**: Data is strictly isolated between families
- **Role-Based Access**: Different permissions for kids, parents, and admins
- **Anonymous Blocking**: All anonymous access is explicitly denied

### Authentication Features
- Email/password authentication via Supabase Auth
- Multi-factor authentication (MFA) support
- Rate limiting on authentication attempts
- Session management and automatic token refresh
- Admin-specific authentication flow

### Data Protection
- Encrypted family messages
- Secure storage of sensitive data
- Audit logging for admin actions
- Security alert system
- IP-based rate limiting

## Key Features

### Gamification
- Points-based reward system
- Level progression
- Achievement badges
- Streak tracking
- Mini-games for engagement

### Family Management
- Family code invitation system
- Real-time chat communication
- Chore assignment and tracking
- Progress monitoring
- Reward approval workflow

### Analytics and Insights
- Completion time tracking
- Performance analytics
- Predictive insights
- Custom report generation
- A/B testing framework

### Affiliate Integration
- Partner store integration
- Custom URL support for affiliates
- Product wishlist linking
- Purchase tracking
- Commission management

### Administrative Tools
- User management
- Family oversight
- Security monitoring
- Feedback management
- System analytics

## Recent Updates

### Affiliate System Enhancement
- Added `custom_url` field to `approved_affiliates` table
- Updated affiliate management interface
- Enhanced affiliate display with custom URLs
- Improved admin affiliate management workflow

### Security Improvements
- Fixed admin sign-out security error
- Enhanced session management
- Improved error handling in authentication

## Development Workflow

### Environment Setup
```bash
npm install
npm run dev
```

### Database Management
- Supabase CLI for migrations
- Automatic type generation
- RLS policy validation

### Code Quality
- TypeScript for type safety
- ESLint for code standards
- Component-based architecture
- Custom hooks for reusability

## Future Roadmap

### Planned Features
- Advanced AI recommendations
- Mobile app development
- Extended affiliate partnerships
- Enhanced analytics dashboard
- Social features and leaderboards

### Technical Improvements
- Performance optimization
- Enhanced caching strategies
- Advanced security features
- Improved error handling
- Extended testing coverage

## File Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── *.tsx         # Feature components
├── contexts/         # React contexts
├── hooks/           # Custom hooks
├── pages/           # Page components
├── utils/           # Utility functions
├── integrations/
│   └── supabase/    # Supabase client and types
└── lib/             # Library configurations

supabase/
├── functions/       # Edge functions
├── migrations/      # Database migrations
└── config.toml     # Supabase configuration
```

This comprehensive knowledge document serves as the definitive reference for the ChoreQuest project, covering all aspects from architecture to implementation details.