# ChoreQuest - Complete Project Knowledge Base
*Last Updated: January 2025*

## 🏠 Project Overview

**ChoreQuest** is a comprehensive gamified chore management platform designed to motivate children through rewards, badges, and family engagement while providing parents with powerful analytics and management tools.

### Core Vision
Transform household chore management into an engaging, educational experience that builds responsibility in children while providing parents with insights into family dynamics and productivity patterns.

### Project URLs
- **Live URL**: https://lovable.dev/projects/85bfc207-d054-44f1-94af-30f7d268923b
- **Repository**: Connected via Lovable Git integration

---

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **React 18.3.1** with TypeScript
- **Vite** for build tooling and development server
- **React Router DOM 6.30.1** with HashRouter for client-side routing

### UI & Styling
- **Tailwind CSS 3.4.17** with custom design system
- **shadcn/ui** component library with Radix UI primitives
- **Lucide React** for iconography
- **Recharts** for data visualization

### Backend & Database
- **Supabase** as Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication & authorization
  - Edge Functions for serverless logic
  - File storage capabilities

### State Management
- **React Query (TanStack Query)** for server state
- **React Context** for authentication and global state
- **React Hook Form** with Zod validation for forms

### Development Tools
- **TypeScript 5.8.3** for type safety
- **ESLint 9.32.0** with React hooks plugin
- **Lovable Tagger** for AI-assisted development

---

## 👥 User Roles & Access Control

### 1. Kids Portal (`/kids`)
**Target Users**: Children aged 6-16
**Theme**: Bright, playful, gamified experience

**Core Features**:
- **Chore Management**: View assigned chores, mark complete, track progress
- **Gamification**: Points system, badges, level progression, streaks
- **Rewards System**: Wishlist creation, points redemption, goal tracking
- **Mini-Games**: Fun activities after chore completion
- **Motivation Journal**: Reflection and emotional tracking
- **Family Chat**: Communication with family members

**Key Components**:
- `ChoreCard` - Interactive chore display with timer
- `RewardBadge` - Achievement visualization
- `MiniGames` - Post-completion entertainment
- `MotivationJournal` - Reflection and growth tracking

### 2. Parents Portal (`/parents`)
**Target Users**: Parents and guardians
**Theme**: Professional, calm, control-focused

**Core Features**:
- **Family Management**: Add children, manage family settings
- **Chore Assignment**: Create, assign, and monitor chores
- **Analytics Dashboard**: Track completion rates, patterns, insights
- **Reward Approval**: Review and approve wishlist items
- **Progress Monitoring**: View detailed family progress reports
- **Communication Hub**: Family chat and announcement system

**Key Components**:
- `ChoreAssignmentForm` - Comprehensive chore creation
- `AnalyticsDashboard` - Data visualization and insights
- `AddChildForm` - Family member management
- `FamilyChat` - Communication management

### 3. Admin Portal (`/admin`)
**Target Users**: System administrators
**Theme**: Professional, data-driven, comprehensive control

**Core Features**:
- **User Management**: View all users, roles, activity
- **System Analytics**: Platform-wide metrics and KPIs
- **A/B Testing**: Feature testing and optimization
- **Affiliate Management**: Partner store management with custom URLs
- **Security Monitoring**: Security alerts, audit logs, rate limiting
- **Feedback Management**: User feedback review and response
- **Report Generation**: Comprehensive system reports

**Key Components**:
- `UserManagementTab` - System-wide user administration
- `AffiliateManagement` - Partner store management
- `PredictiveInsights` - Advanced analytics
- `RealTimeDashboard` - Live system monitoring

---

## 🗄️ Database Schema & Security

### Core Tables

**Users & Authentication**:
- `profiles` - Extended user information, points, levels, streaks
- `user_mfa_settings` - Multi-factor authentication configuration
- `mfa_audit_log` - MFA usage tracking

**Family Structure**:
- `families` - Family groups with parent ownership
- `family_members` - Many-to-many relationship between users and families
- `family_ai_settings` - AI and analytics preferences per family

**Chore Management**:
- `chores` - Task definitions with assignments and status
- `chore_analytics` - Performance metrics and completion data
- `progress_logs` - Detailed activity tracking

**Gamification**:
- `badges` - Achievement definitions
- `user_badges` - User achievement tracking
- `rewards` - Reward catalog and redemption tracking
- `wishlist_items` - User wishlist with approval workflow

**Communication**:
- `family_messages` - Encrypted family chat system
- `motivation_journal` - Personal reflection entries

**System Management**:
- `ab_tests` & `ab_test_assignments` - Feature testing framework
- `approved_affiliates` - Partner store management
- `user_feedback` - User feedback and support
- `security_alerts` - Security monitoring and incident tracking
- `auth_rate_limits` - Brute force protection

### Security Features

**Row-Level Security (RLS)**:
- All tables have comprehensive RLS policies
- Family-based access control
- Role-based permissions (admin, parent, kid)
- Anonymous access prevention

**Authentication & Authorization**:
- Supabase Auth integration
- Multi-factor authentication support
- Session management with auto-refresh
- Secure password policies

**Data Protection**:
- Encrypted message storage
- Rate limiting for authentication
- Security audit logging
- Sensitive data masking

---

## 🎨 Design System

### Color Palette
**Kids Theme**: Bright, playful colors
- Primary: `hsl(268, 76%, 62%)` (Purple)
- Secondary: `hsl(172, 76%, 55%)` (Turquoise)
- Accent: `hsl(45, 93%, 58%)` (Yellow)
- Success: `hsl(142, 71%, 45%)` (Green)

**Parents Theme**: Calm, professional colors
- Primary: `hsl(142, 71%, 45%)` (Green)
- Secondary: `hsl(200, 98%, 39%)` (Blue)
- Accent: `hsl(39, 84%, 56%)` (Orange)

**Admin Theme**: Professional, serious colors
- Primary: `hsl(215, 28%, 17%)` (Dark Blue)
- Secondary: `hsl(210, 40%, 96%)` (Light Gray)
- Accent: `hsl(221, 83%, 53%)` (Blue)

### Design Tokens
- **Gradients**: Role-specific gradient backgrounds
- **Shadows**: Themed shadow systems with glow effects
- **Animations**: Bounce, float, and pulse animations
- **Typography**: Semantic font sizing and weights

### Component Patterns
- **Cards**: Themed card components for different user types
- **Buttons**: Consistent button variants across themes
- **Forms**: Standardized form layouts with validation
- **Navigation**: Role-appropriate navigation patterns

---

## 🔧 Key Components & Hooks

### Custom Hooks

**Data Management**:
- `useChores()` - Chore CRUD operations and real-time updates
- `useFamily()` - Family management and member operations
- `useWishlist()` - Wishlist creation and management
- `useAffiliates()` - Affiliate partner data fetching

**Analytics & Insights**:
- `useAnalyticsData()` - Platform-wide analytics aggregation
- `usePredictiveAnalytics()` - Advanced pattern recognition
- `useReportGeneration()` - PDF report creation
- `useABTesting()` - Feature testing integration

**Authentication & Security**:
- `useAdmin()` - Admin role verification
- `useAuth()` - User authentication state
- `useSecurityMonitoring()` - Security event tracking

**Communication**:
- `useFamilyChat()` - Real-time messaging with encryption

### Core Components

**Chore Management**:
- `ChoreCard` - Interactive chore display with status, timer, completion
- `ChoreAssignmentForm` - Comprehensive chore creation with validation
- `ChoreTimer` - Countdown timer with completion tracking

**Gamification**:
- `RewardBadge` - Achievement display with animations
- `ConfettiEffect` - Celebration animations
- `MiniGames` - Post-completion entertainment

**Analytics**:
- `AnalyticsDashboard` - Multi-tab analytics interface
- `KPICards` - Key performance indicator display
- `ChartComponents` - Recharts-based data visualizations
- `DataTable` - Sortable, filterable data tables
- `ExportFunctionality` - PDF report generation

**Communication**:
- `FamilyChat` - Real-time messaging interface
- `MotivationJournal` - Reflection and goal setting

### UI Components (shadcn/ui)
Comprehensive component library including:
- Form controls (Input, Select, Checkbox, etc.)
- Navigation (Tabs, Accordion, Breadcrumb)
- Feedback (Toast, Alert, Dialog)
- Data display (Table, Card, Badge)
- Layout (Sidebar, Separator, Scroll Area)

---

## 🔌 API Integration & Edge Functions

### Supabase Integration
- **Real-time subscriptions** for live updates
- **RPC functions** for complex database operations
- **Storage integration** for file uploads
- **Auth webhooks** for user lifecycle management

### Edge Functions
Located in `supabase/functions/`:
- `create-user` - User onboarding automation
- `invite-child` - Child invitation workflow
- `create-test-family` - Development testing utilities
- `security-monitor` - Security event processing

### External APIs
- **Affiliate Partners** - Integration ready for e-commerce APIs
- **Email Services** - Invitation and notification system
- **Analytics Providers** - Third-party analytics integration

---

## 📱 Routing & Navigation

### Route Structure
```
/ - Landing page with portal selection
/auth - Authentication (login/signup)
/kids - Kids portal (protected, role: kid)
/parents - Parents portal (protected, role: parent)
/admin/auth - Admin authentication
/admin - Admin portal (protected, admin role)
```

### Protected Routes
- `ProtectedRoute` - Family member authentication
- `AdminProtectedRoute` - Admin-specific authentication
- Role-based access control
- Automatic redirection for unauthorized access

### Navigation Patterns
- **Portal-specific navigation** adapted to user roles
- **Breadcrumb navigation** for complex workflows
- **Deep linking** support for specific features

---

## 📊 Analytics & Monitoring

### Family Analytics
- **Chore completion rates** by child and time period
- **Point earning patterns** and motivation trends
- **Engagement metrics** across family members
- **Progress tracking** with goal achievement

### System Analytics
- **User growth** and retention metrics
- **Feature usage** patterns and adoption rates
- **Performance monitoring** with error tracking
- **A/B testing** results and optimization

### Security Monitoring
- **Authentication attempts** with rate limiting
- **Access pattern analysis** for anomaly detection
- **Data access auditing** with violation alerts
- **Real-time security alerts** with automated responses

---

## 🚀 Development Workflow

### Setup Instructions
```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Configuration
- **Supabase URL**: `https://rdvkwnoeojjvjuknlsjd.supabase.co`
- **Environment variables** managed through Supabase secrets
- **Local development** with Supabase CLI integration

### Code Quality
- **TypeScript** for type safety across the application
- **ESLint** with React-specific rules
- **Prettier** for consistent code formatting
- **Git hooks** for pre-commit validation

### Testing Strategy
- **Component testing** with React Testing Library
- **Integration testing** for critical user flows
- **E2E testing** for complete user journeys
- **Database testing** with Supabase test utilities

---

## 🔐 Security Implementation

### Authentication
- **Multi-factor authentication** with TOTP support
- **Session management** with automatic refresh
- **Password policies** with strength requirements
- **Account lockout** after failed attempts

### Authorization
- **Role-based access control** (RBAC)
- **Row-level security** on all database tables
- **API endpoint protection** with JWT validation
- **Resource-level permissions** for fine-grained control

### Data Protection
- **Message encryption** for family communications
- **Personal data masking** in shared views
- **Audit logging** for sensitive operations
- **Data retention policies** for compliance

### Security Monitoring
- **Real-time threat detection** with automated alerts
- **Rate limiting** to prevent abuse
- **Security headers** for web protection
- **Regular security audits** with automated scanning

---

## 📈 Recent Updates & Features

### Latest Enhancements
1. **Affiliate Management System**
   - Admin panel for partner store management
   - Custom URL support for different portals
   - Logo and branding customization
   - Active/inactive status control

2. **Enhanced Analytics Dashboard**
   - Real-time data visualization
   - Export functionality with PDF reports
   - Advanced filtering and data tables
   - Predictive insights and trends

3. **Security Improvements**
   - Rate limiting implementation
   - MFA audit logging
   - Security alert system
   - Enhanced RLS policies

4. **User Experience Enhancements**
   - Improved error handling with boundaries
   - Loading states and optimistic updates
   - Responsive design improvements
   - Accessibility enhancements

### Performance Optimizations
- **Code splitting** for reduced bundle sizes
- **Lazy loading** for improved initial load
- **Query optimization** with React Query caching
- **Image optimization** with WebP support

---

## 🔮 Future Roadmap

### Short-term Goals (Next 3 months)
- **Mobile app development** with React Native
- **Advanced AI suggestions** for chore recommendations
- **Integration marketplace** for third-party services
- **Enhanced gamification** with leaderboards and competitions

### Medium-term Goals (3-6 months)
- **Multi-language support** for international expansion
- **Advanced analytics** with machine learning insights
- **Parent collaboration** features for divorced families
- **Educational content** integration for skill building

### Long-term Vision (6+ months)
- **White-label solution** for schools and organizations
- **API marketplace** for third-party integrations
- **Advanced AI coaching** for family dynamics
- **Enterprise features** for large-scale deployments

### Scalability Considerations
- **Database sharding** for high-volume users
- **CDN integration** for global performance
- **Microservices architecture** for component isolation
- **Auto-scaling infrastructure** for peak usage

---

## 🛠️ Maintenance & Support

### Monitoring
- **Application performance** monitoring with real-time alerts
- **Database performance** tracking with query optimization
- **User experience** monitoring with error tracking
- **Security monitoring** with automated threat detection

### Backup & Recovery
- **Automated database backups** with point-in-time recovery
- **Code repository** backup with multiple mirrors
- **Configuration management** with version control
- **Disaster recovery** procedures with tested restoration

### Documentation
- **API documentation** with interactive examples
- **Component library** documentation with Storybook
- **User guides** for each portal type
- **Admin documentation** for system management

---

## 📄 File Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui component library
│   ├── analytics/       # Analytics-specific components
│   └── *.tsx           # Feature-specific components
├── contexts/            # React context providers
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── utils/              # Utility functions
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Shared libraries
├── index.css           # Design system and global styles
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge functions
├── migrations/         # Database migrations
└── config.toml        # Supabase configuration

docs/                   # Project documentation
├── README.md          # Documentation index
├── architecture.md    # Technical architecture
├── user-roles.md      # User role specifications
└── *.md              # Additional documentation
```

---

## 🎯 Key Success Metrics

### User Engagement
- **Daily active users** by portal type
- **Chore completion rates** across families
- **Feature adoption** and usage patterns
- **Session duration** and return rates

### Business Metrics
- **Family acquisition** and onboarding success
- **User retention** at 30, 60, 90 days
- **Feature utilization** across user segments
- **Support ticket** volume and resolution time

### Technical Metrics
- **Application performance** (load times, responsiveness)
- **System reliability** (uptime, error rates)
- **Security posture** (incident response, vulnerability management)
- **Development velocity** (feature delivery, bug resolution)

---

*This knowledge base is maintained alongside the codebase and should be updated with each major feature release or architectural change.*