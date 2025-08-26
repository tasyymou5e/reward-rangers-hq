# ChoreQuest - Project Knowledge Base

## 📋 Project Overview

**ChoreQuest** is a comprehensive gamified family chore management system that turns household tasks into engaging adventures. The platform provides role-based access for kids, parents, and administrators with a focus on motivation, family engagement, and secure data management.

### Core Concept
Transform mundane household chores into exciting quests with points, levels, badges, rewards, and social features that motivate children while giving parents powerful management tools.

---

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **React 18.3.1** with TypeScript
- **Vite** as build tool and development server
- **React Router DOM** for client-side routing (Hash routing)
- **Tailwind CSS** for styling with custom design system
- **Shadcn/ui** component library with Radix UI primitives

### Backend & Database
- **Supabase** for backend services:
  - PostgreSQL database with RLS (Row Level Security)
  - Real-time subscriptions
  - Authentication system
  - Edge Functions for custom logic
  - Security monitoring and rate limiting

### State Management & Data Fetching
- **React Query (@tanstack/react-query)** for server state management
- **React Context** for authentication and global state
- Custom hooks for feature-specific logic

### Key Dependencies
- **@supabase/supabase-js** (v2.56.0) - Backend integration
- **lucide-react** (v0.462.0) - Icon system
- **react-hook-form** (v7.61.1) - Form management
- **zod** (v3.25.76) - Schema validation
- **jspdf** & **jspdf-autotable** - PDF report generation
- **sonner** - Toast notifications
- **recharts** (v2.15.4) - Data visualization

---

## 🎭 User Roles & Portals

### 1. Kids Portal (`/kids`)
**Target Users**: Children using the system to complete chores
**Key Features**:
- Gamified chore completion interface
- Points, levels, and XP system
- Badge collection and achievements
- Interactive chore timer with countdown
- Wishlist management for setting goals
- Mini-games for bonus points after chore completion
- Motivation journal for personal reflection
- Confetti celebrations for completions
- Calendar view for scheduling
- Family leaderboard and social features

**Design Theme**: Bright, playful colors with extensive use of emojis and animations

### 2. Parents Portal (`/parents`)
**Target Users**: Parent/guardian managing family chores and rewards
**Key Features**:
- **Real Family Dashboard**: Displays actual children by name with avatars/initials
- **Individual Child Progress**: Live tracking of each child's XP, level, streaks, and daily completion stats
- **Child Invitation System**: 
  - Send email invitations to children with temporary passwords
  - Automated user account creation and family assignment
  - Professional email templates with ChoreQuest branding
  - Family management interface with current members display
- **Flexible Chore Assignment**: 
  - Assign chores to specific children individually
  - Bulk assign to all children simultaneously
  - Visual child selection with checkboxes
- **Comprehensive Chore Creation**: Full form with title, description, points, difficulty, time estimates, and due dates
- **Real-time Statistics**: Live counts of active children, completed chores, pending tasks
- Wishlist approval/rejection system
- Multi-Factor Authentication (MFA) setup
- Family communication center
- AI-powered predictive insights
- Weekly report generation (PDF exports)
- Reward management system
- Security monitoring dashboard

**Design Theme**: Professional, calm green/blue palette focused on productivity

### 3. Admin Portal (`/admin`)
**Target Users**: System administrators
**Key Features**:
- User management across all families
- System-wide analytics and reporting
- Security monitoring and alerts
- A/B testing management
- Affiliate program management
- Database administration tools
- Performance monitoring
- Bulk operations and data management

**Design Theme**: Dark, professional interface with emphasis on data and controls

---

## 🎨 Design System

### Color Themes (HSL Format)
```css
/* Kids Theme - Bright & Playful */
--kids-primary: 268 76% 62% (Purple)
--kids-secondary: 172 76% 55% (Teal)
--kids-accent: 45 93% 58% (Yellow)
--kids-success: 142 71% 45% (Green)
--kids-background: 270 50% 98% (Light purple)

/* Parents Theme - Calm & Professional */
--parents-primary: 142 71% 45% (Green)
--parents-secondary: 200 98% 39% (Blue)
--parents-accent: 39 84% 56% (Orange)
--parents-background: 150 25% 98% (Light green)

/* Admin Theme - Professional */
--admin-primary: 215 28% 17% (Dark blue)
--admin-secondary: 210 40% 96% (Light gray)
--admin-accent: 221 83% 53% (Blue)
--admin-background: 220 13% 97% (Light gray)
```

### Animation System
- **Bounce effects**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- **Smooth transitions**: `cubic-bezier(0.4, 0, 0.2, 1)`
- **Confetti celebrations** for achievements
- **Floating animations** for decorative elements
- **Scale transforms** on hover effects

### Typography & Spacing
- **Radius**: 1rem base border radius
- **Gradient support**: Multiple themed gradients
- **Shadow system**: Role-specific drop shadows
- **Responsive design**: Mobile-first approach

---

## 🗄️ Database Schema & Key Tables

### Core Tables
1. **profiles** - Extended user information
   - Links to Supabase Auth users
   - Stores points, level, streak data
   - Role-based access (parent, kid, admin)

2. **families** - Family group management
   - Parent ownership model
   - Family codes for joining
   - Family-specific settings

3. **family_members** - User-family relationships
   - Many-to-many relationship
   - Role assignments within families

4. **chores** - Task management
   - Point values and difficulty levels (easy/medium/hard)
   - Assignment and completion tracking
   - Due dates and time estimates  
   - **Bulk assignment support** for multiple children
   - Status tracking (pending/in_progress/completed)
   - Family-based organization
   - Individual and group assignment capabilities

5. **progress_logs** - Activity tracking
   - Points earned history
   - Action logging for analytics
   - Completion timestamps

6. **wishlist_items** - Goal setting system
   - Parent approval workflow
   - Point cost tracking

7. **rewards** - Achievement system
   - Family-specific rewards
   - Point-based redemption

8. **badges** & **user_badges** - Gamification
   - Achievement tracking
   - Progress milestones

### Security Tables
- **security_alerts** - Security event logging
- **auth_rate_limits** - Brute force protection
- **mfa_audit_log** - MFA event tracking

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Supabase Auth** handles user registration/login
2. **Profile creation** triggered automatically via database triggers
3. **Role assignment** during registration (parent/kid)
4. **Family association** through codes or direct assignment

### Security Features
- **Row Level Security (RLS)** on all tables
- **Multi-Factor Authentication** for parents
- **Rate limiting** on authentication attempts
- **Security monitoring** and alerting
- **Encrypted backup codes** for MFA recovery
- **IP-based access controls**
- **Session management** with automatic refresh

### Key Security Functions
```sql
-- Safe profile access with family-based permissions
get_safe_family_profiles(requesting_user_id)

-- Family access validation
validate_family_access(family_id, user_id, required_role)

-- Security event logging
log_security_event(event_type, user_id, metadata)

-- Rate limiting for auth attempts
check_auth_rate_limit(ip_addr, email, max_attempts, block_duration)
```

---

## 🔧 Custom Hooks & Components

### Key Custom Hooks
- **useAuth** - Authentication state management
- **useChores** - Chore CRUD operations with bulk assignment support
  - `createChore()` - Single chore creation
  - `createBulkChores()` - Bulk assignment to multiple children
  - `updateChore()` - Chore modifications
  - `completeChore()` - Completion with points/progress tracking
- **useFamily** - Family management with real-time member data
- **useWishlist** - Wishlist functionality
- **useSecurityMonitoring** - Security event tracking
- **useReportGeneration** - PDF report creation
- **usePredictiveAnalytics** - AI insights
- **useABTesting** - Feature flag management

### Specialized Components
- **ChoreTimer** - Interactive countdown timer for kids
- **ChoreAssignmentForm** - Comprehensive chore creation and assignment interface
  - Individual child selection with visual checkboxes
  - Bulk assignment to all children option
  - Full form validation with Zod schema
  - Date picker for due dates
  - Difficulty levels with emoji indicators
- **AddChildForm** - Child invitation and family management
  - Modal-based form for adding children via email
  - Real-time validation and error handling
  - Success states with automatic dialog management
  - Integration with invite-child edge function
- **Header** - Navigation and user controls
  - User-type specific styling and gradients
  - Logout functionality with proper authentication handling
  - Home navigation and user welcome messages
- **ConfettiEffect** - Celebration animations
- **MiniGames** - Post-completion bonus games
- **MotivationJournal** - Personal reflection tool
- **PredictiveInsights** - AI-powered analytics
- **FamilyChat** - Communication system
- **WishlistCard** - Goal visualization
- **RewardBadge** - Achievement display

---

## 📊 Gamification System

### Points & Levels
- **Base XP**: Chores award 10-50 points based on difficulty
- **Bonus Points**: Mini-games award 5-20 additional points
- **Level Calculation**: `Math.floor(points / 100) + 1`
- **Progress Tracking**: Real-time updates with visual progress bars

### Badge System
- **Achievement Types**: First chore, streak milestones, difficulty challenges
- **Auto-Award Logic**: Triggered by completion events
- **Visual Representation**: Icon-based with rarity indicators
- **Social Features**: Badge sharing and family leaderboards

### Reward Mechanisms
- **Point-Based Redemption**: Virtual currency system
- **Parent Approval**: Workflow for physical rewards
- **Goal Setting**: Wishlist integration for motivation
- **Milestone Celebrations**: Confetti and notifications

---

## 🤖 AI & Analytics Features

### Predictive Insights
- **Completion Pattern Analysis**: Identify optimal chore timing
- **Family Engagement Metrics**: Track participation trends
- **Personalized Recommendations**: Suggest chores and rewards
- **Performance Forecasting**: Predict family success rates

### Report Generation
- **Weekly Family Reports**: Comprehensive PDF exports
- **Individual Progress**: Child-specific analytics
- **Trend Analysis**: Long-term pattern identification
- **Export Options**: PDF format with charts and summaries

### A/B Testing Framework
- **Feature Toggles**: Controlled feature rollouts
- **User Segmentation**: Test different user experiences
- **Performance Metrics**: Track engagement and success rates
- **Automated Assignment**: Random test group allocation

---

## 🛠️ Development Guidelines

### File Organization
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn base components
│   └── [Feature]*.tsx   # Feature-specific components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── pages/               # Route components
├── lib/                 # Utility functions
└── integrations/        # External service configs
    └── supabase/        # Supabase client & types
```

### Code Patterns
- **TypeScript First**: Strict typing throughout
- **Component Composition**: Small, focused components
- **Custom Hooks**: Feature logic abstraction
- **Form Management**: React Hook Form + Zod validation
- **Bulk Operations**: Efficient database operations for multiple records
- **Real-time Updates**: Live data synchronization
- **Error Boundaries**: Graceful error handling
- **Loading States**: User feedback during async operations

### Styling Conventions
- **Tailwind CSS**: Utility-first approach
- **Design Tokens**: Semantic color variables
- **Component Variants**: cva pattern for variations
- **Responsive Design**: Mobile-first breakpoints
- **Theme Consistency**: Role-based color schemes

---

## 🔄 State Management Strategy

### Server State (React Query)
- **Automatic Caching**: Reduces unnecessary API calls
- **Background Updates**: Keep data fresh
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Retry logic and fallbacks

### Client State (React Context + useState)
- **Authentication**: User session and profile
- **UI State**: Modals, notifications, loading states
- **Feature Flags**: A/B test assignments
- **User Preferences**: Settings and customizations

### Real-time Updates (Supabase Subscriptions)
- **Live Data**: Chore completions, family activity
- **Notifications**: Instant feedback for family members
- **Collaborative Features**: Multi-user interactions
- **Conflict Resolution**: Handle concurrent updates

---

## 🚀 Deployment & Environment

### Environment Configuration
- **Supabase Integration**: Project ID, keys, and URLs
- **Production URLs**: https://lovable.app domain
- **Hash Routing**: Client-side routing strategy
- **Build Optimization**: Vite production builds

### Performance Considerations
- **Code Splitting**: Lazy loading for route components
- **Image Optimization**: Responsive images with lazy loading
- **Bundle Analysis**: Regular bundle size monitoring
- **Caching Strategy**: Service worker for offline functionality

---

## 🧪 Testing & Quality Assurance

### Testing Strategy
- **Component Testing**: Individual component behavior
- **Integration Testing**: Feature workflow validation
- **User Flow Testing**: End-to-end critical paths
- **Security Testing**: RLS policy validation

### Code Quality
- **ESLint Configuration**: Consistent code standards
- **TypeScript Strict Mode**: Type safety enforcement
- **Error Monitoring**: Production error tracking
- **Performance Monitoring**: Core Web Vitals tracking

---

## 📚 Integration Points

### Supabase Services
- **Database**: PostgreSQL with custom functions
- **Auth**: Email/password with MFA support
- **Edge Functions**: Custom business logic
  - `invite-child` - User creation and email invitations
  - `create-user` - User account setup
  - `create-test-family` - Development family creation
  - `security-monitor` - Security event tracking
- **Real-time**: Live data subscriptions
- **Storage**: File uploads (when needed)

### External Dependencies
- **PDF Generation**: jsPDF for reports
- **Email Service**: Resend for invitation emails and notifications
- **Date Handling**: date-fns for time calculations
- **Form Validation**: React Hook Form + Zod
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icon library

---

## 🔮 Future Enhancement Areas

### Planned Features
- **Mobile App**: React Native version
- **Voice Commands**: Smart speaker integration
- **IoT Integration**: Smart home device connectivity
- **Advanced AI**: Machine learning recommendations
- **Social Features**: Friend families and competitions
- **Enhanced Assignment**: 
  - Recurring chore templates
  - Advanced scheduling options
  - Chore dependency chains
  - Automatic assignment based on child availability
- **Communication Features**:
  - SMS notifications for parents
  - Push notifications for completed chores
  - Video call integration for family meetings
- **Advanced Invitations**:
  - QR code family joining
  - Bulk invitation for multiple children
  - Guest access for babysitters/caregivers

### Scalability Considerations
- **Multi-tenancy**: Support for larger organizations
- **Internationalization**: Multi-language support
- **Advanced Analytics**: Business intelligence features
- **Marketplace**: Third-party integrations
- **White-label**: Customizable branding options

---

## 🐛 Common Issues & Solutions

### Parent Portal Issues
- **Problem**: Children not displaying
- **Solution**: Ensure family members have 'kid' role and are properly linked
- **Prevention**: Validate family relationships in database

### Chore Assignment Issues  
- **Problem**: Bulk assignment failing
- **Solution**: Check family_id and assigned_to relationships
- **Prevention**: Use createBulkChores hook for multiple assignments

### Authentication Issues
- **Problem**: Redirect URL mismatches
- **Solution**: Configure Supabase Auth URLs properly
- **Prevention**: Environment-specific URL handling

### Permission Errors
- **Problem**: RLS policy violations
- **Solution**: Use security functions for data access
- **Prevention**: Thorough RLS testing

### Performance Issues
- **Problem**: Slow initial load
- **Solution**: Code splitting and lazy loading
- **Prevention**: Regular bundle analysis

### Data Consistency
- **Problem**: Stale data across components
- **Solution**: React Query invalidation strategies
- **Prevention**: Proper cache key management

---

## 📝 Development Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project
- Git for version control

### Quick Start
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🆕 Recent Updates & Features

### Child Invitation System (Latest)
- **Email-based Invitations**: Parents can invite children via email with temporary passwords
- **Automated Account Creation**: Edge function creates user accounts and assigns to families
- **Professional Email Templates**: Branded HTML emails with ChoreQuest styling and instructions
- **Family Management Interface**: New "Children" tab with family member management
- **Security & Validation**: Parent authorization, automatic cleanup on failures, RLS compliance

### UI/UX Improvements
- **Enhanced Header Component**: Added logout functionality with proper authentication handling
- **AddChildForm Modal**: Beautiful form interface with real-time validation and success states
- **Family Dashboard Enhancement**: Shows real children with invitation capabilities
- **Navigation Improvements**: Proper home navigation and user session management

### Technical Enhancements
- **invite-child Edge Function**: Comprehensive user creation, family assignment, and email delivery
- **Resend Integration**: Professional email service for invitation delivery
- **Form Validation**: React Hook Form + Zod for robust input validation
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Authentication Flow**: Improved logout functionality across all user types

### Previous Updates
- **Real Children Display**: Replaced mock data with actual family members
- **Flexible Chore Assignment**: Individual and bulk assignment options
- **Enhanced UI**: Child selection with avatars, progress tracking, and streak indicators
- **Bulk Operations**: Efficient database operations for multiple chore creation
- **Form Validation**: Comprehensive form with Zod schema validation
- **Real-time Stats**: Live dashboard with completion counts and progress

### Technical Improvements
- **ChoreAssignmentForm Component**: New comprehensive chore creation interface
- **Bulk Database Operations**: Enhanced useChores hook with createBulkChores function
- **Improved Data Flow**: Better integration between family data and chore assignment
- **Enhanced TypeScript**: Proper typing for bulk operations and form data

---

This knowledge base should be updated as the project evolves, particularly when new features are added or architectural changes are made. It serves as both documentation and onboarding material for new developers joining the project.