# ChoreQuest - Complete Project Knowledge Document 2025

## Project Overview

**ChoreQuest** is a comprehensive gamified chore management platform designed to help families organize household tasks while making them engaging for children through game-like mechanics. The application features role-based access control, comprehensive security measures, analytics, and a reward system.

### 🎯 Core Purpose
- **Family Chore Management**: Streamline household task distribution and tracking
- **Gamification**: Make chores engaging through points, levels, badges, and rewards
- **Family Communication**: Enable secure family messaging and progress sharing
- **Analytics & Insights**: Provide detailed analytics for parents and predictive insights
- **Security First**: Enterprise-grade security with comprehensive monitoring

---

## 🏗️ Technical Architecture

### **Technology Stack**
- **Frontend**: React 18.3.1 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with MFA support
- **State Management**: React Context + TanStack Query
- **Routing**: React Router DOM (Hash routing)
- **Security**: Comprehensive RLS policies + security monitoring

### **Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── analytics/      # Analytics dashboard components
│   └── [feature]/      # Feature-specific components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── integrations/       # External service integrations
├── utils/              # Utility functions
└── lib/                # Library configurations
```

---

## 👥 User Roles & Authentication

### **Role System**
1. **Kids** (`kid`)
   - View assigned chores
   - Complete chores and earn points
   - Manage wishlist items
   - Access motivation journal
   - Participate in family chat

2. **Parents** (`parent`)
   - Create and assign chores
   - Approve completed chores
   - Manage family members
   - View analytics and reports
   - Manage rewards system

3. **Admins** (`admin`, `full_admin`, `read_only_admin`, `report_admin`)
   - Full system administration
   - User and family management
   - Security monitoring
   - System analytics
   - Content moderation

### **Authentication System**

#### **Dual Authentication Architecture**
- **Main Auth**: User authentication (`AuthContext.tsx`)
- **Admin Auth**: Separate admin authentication (`AdminAuthContext.tsx`)

#### **Security Features**
- **Secure Profile Access**: All profile data accessed via secure functions
- **Email Masking**: Automatic email privacy protection
- **MFA Support**: Two-factor authentication with TOTP and backup codes
- **Rate Limiting**: Authentication attempt throttling
- **Security Monitoring**: Comprehensive logging and alerting
- **Session Management**: Proper session handling with auto-refresh

#### **Authentication Hooks**
- `useAuth()`: Main authentication context
- `useAdminAuth()`: Admin authentication context
- `useSecureAuth()`: Enhanced authentication with rate limiting
- `useSecureProfiles()`: Secure profile data access
- `useSecurityMonitoring()`: Security event monitoring

---

## 🔒 Security Implementation

### **Security Architecture**
ChoreQuest implements enterprise-grade security measures:

#### **Database Security**
- **Row Level Security (RLS)**: Comprehensive policies on all tables
- **Secure Functions**: All data access through security definer functions
- **Email Protection**: Mandatory email masking for privacy
- **Data Isolation**: Family-based data segregation

#### **Authentication Security**
- **Rate Limiting**: `check_auth_rate_limit_secure()` function
- **MFA Encryption**: `encrypt_mfa_secret_secure()` / `decrypt_mfa_secret_secure()`
- **Secure Sessions**: Proper session management with token refresh
- **Password Security**: Integration with HaveIBeenPwned for leaked password detection

#### **Security Monitoring**
- **Real-time Alerts**: `SecurityAlert.tsx` component
- **Security Dashboard**: `SecurityDashboard.tsx` for admin monitoring
- **Event Logging**: `useSecurityMonitoring.ts` hook
- **Audit Trails**: Comprehensive logging of all security events

#### **Data Protection**
- **Profile Security**: `get_profiles_secure()` function with email masking
- **Family Data**: `get_family_data_secure()` with access validation
- **MFA Protection**: Encrypted storage of MFA secrets and backup codes

### **Security Functions**
```sql
-- Key security functions
get_profiles_secure(requesting_user_id)
get_profile_by_id_secure(target_user_id, requesting_user_id)
get_family_data_secure(family_id_param, requesting_user_id)
get_mfa_backup_codes_secure()
update_profile_email_secure(new_email)
check_auth_rate_limit_secure(ip_addr, email_addr)
```

---

## 🗄️ Database Schema

### **Core Tables**

#### **User Management**
- `profiles`: User profiles with role-based access
- `user_mfa_settings`: MFA configuration and encrypted secrets
- `auth_rate_limits`: Authentication rate limiting
- `security_alerts`: Security event tracking

#### **Family System**
- `families`: Family groups with parent hierarchy
- `family_members`: Family membership relationships
- `family_messages`: Encrypted family communication
- `family_ai_settings`: AI and analytics preferences
- `family_reports`: Generated family reports

#### **Chore Management**
- `chores`: Chore definitions and assignments
- `chore_calendar`: Scheduled chore instances
- `chore_analytics`: Performance analytics
- `progress_logs`: Action history tracking

#### **Gamification**
- `badges`: Achievement definitions
- `user_badges`: User badge awards
- `rewards`: Reward definitions and redemptions
- `wishlist_items`: User wishlists with affiliate integration

#### **Analytics & Feedback**
- `motivation_journal`: User reflection entries
- `user_feedback`: User feedback and suggestions
- `ab_tests`: A/B testing framework
- `ab_test_assignments`: User test assignments

#### **Administration**
- `approved_affiliates`: Affiliate partner management
- `mfa_audit_log`: MFA security auditing

### **Key Database Functions**
- **Security**: Rate limiting, encryption, secure data access
- **Family Management**: Validation, access control
- **Notifications**: Automated chore approval notifications
- **Analytics**: Data aggregation and insights

---

## 🎮 Core Features

### **Chore Management System**
- **Chore Creation**: Parents create chores with points, difficulty, time estimates
- **Assignment**: Flexible assignment to family members
- **Completion Tracking**: Status management (pending → completed → approved)
- **Calendar Integration**: `ChoreCalendar.tsx` for scheduling
- **Timer Functionality**: `ChoreTimer.tsx` for time tracking

### **Gamification Engine**
- **Points System**: Earn XP for completed chores
- **Level Progression**: Automatic level advancement
- **Badge System**: Achievement tracking and rewards
- **Streaks**: Daily completion streaks
- **Leaderboards**: Family competition elements

### **Reward System**
- **Wishlist Management**: `WishlistForm.tsx` and `WishlistCard.tsx`
- **Affiliate Integration**: `AffiliateDisplay.tsx` and `AffiliateManagement.tsx`
- **Point Redemption**: Spend points on rewards
- **Approval Workflow**: Parent approval for reward redemptions

### **Analytics & Insights**
- **Performance Dashboard**: `AnalyticsDashboard.tsx`
- **Predictive Analytics**: `PredictiveInsights.tsx`
- **Real-time Monitoring**: `RealTimeDashboard.tsx`
- **Report Generation**: `ExportFunctionality.tsx`
- **KPI Tracking**: `KPICards.tsx`

### **Communication Features**
- **Family Chat**: `FamilyChat.tsx` with encryption
- **Motivation Journal**: `MotivationJournal.tsx` for reflection
- **Notifications**: `NotificationBell.tsx` for updates
- **Feedback System**: `FeedbackWidget.tsx`

---

## 🎨 Design System

### **Theme Architecture**
The application uses a comprehensive design system with role-based themes:

#### **Design Tokens** (index.css)
```css
/* Kids Theme - Bright and Playful */
--kids-primary: 268 76% 62%;     /* Purple */
--kids-secondary: 172 76% 55%;   /* Teal */
--kids-accent: 45 93% 58%;       /* Yellow */

/* Parents Theme - Calm and Professional */
--parents-primary: 142 71% 45%;   /* Green */
--parents-secondary: 200 98% 39%; /* Blue */
--parents-accent: 39 84% 56%;     /* Orange */

/* Admin Theme - Professional */
--admin-primary: 215 28% 17%;     /* Dark Blue */
--admin-secondary: 210 40% 96%;   /* Light Gray */
--admin-accent: 221 83% 53%;      /* Blue */
```

#### **Component System**
- **shadcn/ui**: Base component library
- **Custom Variants**: Role-specific component variations
- **Responsive Design**: Mobile-first approach
- **Animation System**: CSS animations and transitions

#### **Design Principles**
- **Semantic Colors**: HSL color system with CSS variables
- **Consistent Spacing**: Tailwind spacing scale
- **Accessibility**: WCAG compliance
- **Performance**: Optimized for fast loading

---

## 🔧 Custom Hooks

### **Authentication Hooks**
- `useAuth()`: Main authentication state
- `useSecureAuth()`: Enhanced auth with rate limiting
- `useSecureProfiles()`: Secure profile data access
- `useSecureFamily()`: Secure family data access

### **Feature Hooks**
- `useChores()`: Chore management
- `useFamily()`: Family operations
- `useWishlist()`: Wishlist management
- `useNotifications()`: Notification system
- `useFamilyChat()`: Chat functionality

### **Analytics Hooks**
- `useAnalyticsData()`: Analytics data fetching
- `usePredictiveAnalytics()`: AI insights
- `useReportGeneration()`: Report creation
- `useABTesting()`: A/B test management

### **Admin Hooks**
- `useAdmin()`: Admin functionality
- `useSecurityMonitoring()`: Security monitoring
- `useAffiliates()`: Affiliate management

---

## 📱 Page Components

### **Main Pages**
- `Index.tsx`: Landing page with role selection
- `Auth.tsx`: Authentication (login/signup)
- `KidsPortal.tsx`: Child-focused interface
- `ParentsPortal.tsx`: Parent management interface
- `AdminPortal.tsx`: Administrative dashboard
- `NotFound.tsx`: 404 error page

### **Admin Pages**
- `AdminAuth.tsx`: Admin authentication
- `AdminPortal.tsx`: Full admin dashboard with tabs:
  - User Management
  - Analytics Dashboard
  - Security Dashboard
  - Affiliate Management
  - System Settings

---

## 🔐 Security Monitoring

### **Security Dashboard Features**
- **Real-time Alerts**: Immediate notification of security events
- **Alert Classification**: Critical, High, Medium, Low severity levels
- **Event Correlation**: Pattern detection and analysis
- **Audit Trails**: Comprehensive logging
- **Admin Controls**: Alert resolution and management

### **Monitored Events**
- Authentication attempts and failures
- Profile data access
- MFA configuration changes
- Admin actions
- Data access violations
- Rate limit violations

### **Security Components**
- `SecurityAlert.tsx`: Alert display component
- `SecurityDashboard.tsx`: Comprehensive monitoring interface
- `useSecurityMonitoring.ts`: Security event management

---

## 🚀 Deployment & Configuration

### **Environment Setup**
- **Supabase Integration**: Full backend integration
- **Edge Functions**: Serverless function deployment
- **Environment Variables**: Secure configuration management
- **Build Process**: Vite build system with TypeScript

### **Supabase Configuration**
- **Project ID**: rdvkwnoeojjvjuknlsjd
- **Database**: PostgreSQL with RLS
- **Authentication**: Comprehensive auth setup
- **Storage**: File upload capabilities
- **Edge Functions**: Serverless compute

### **Security Configuration**
- **Leaked Password Protection**: HaveIBeenPwned integration
- **Rate Limiting**: Authentication throttling
- **URL Configuration**: Proper redirect setup
- **CORS**: Cross-origin resource sharing

---

## 📊 Analytics & Monitoring

### **Analytics System**
- **Chore Analytics**: Performance tracking and insights
- **User Behavior**: Activity monitoring and patterns
- **Family Metrics**: Progress and engagement tracking
- **Predictive Insights**: AI-powered recommendations

### **Monitoring Tools**
- **Security Monitoring**: Real-time threat detection
- **Performance Monitoring**: Application health tracking
- **Error Handling**: Comprehensive error boundary system
- **Audit Logging**: Complete action history

---

## 🛠️ Development Practices

### **Code Quality**
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Component Structure**: Modular, reusable components
- **Security First**: Security considerations in all development

### **Security Practices**
- **Secure Functions**: All database access through secure functions
- **Input Validation**: Comprehensive validation on all inputs
- **Error Handling**: Secure error messaging
- **Audit Logging**: Complete action tracking

### **Performance Optimization**
- **Lazy Loading**: Component and route lazy loading
- **Code Splitting**: Bundle optimization
- **Caching**: Efficient data caching strategies
- **Database Optimization**: Efficient queries and indexing

---

## 🔮 Future Considerations

### **Scalability**
- **Horizontal Scaling**: Database and application scaling
- **Performance Monitoring**: Comprehensive performance tracking
- **Feature Flags**: A/B testing and gradual rollouts
- **API Rate Limiting**: Advanced rate limiting strategies

### **Security Enhancements**
- **Advanced MFA**: Additional authentication methods
- **Zero Trust**: Enhanced security architecture
- **Compliance**: GDPR and privacy regulation compliance
- **Threat Intelligence**: Advanced threat detection

### **Feature Roadmap**
- **Mobile Application**: Native mobile app development
- **AI Integration**: Enhanced AI capabilities
- **Social Features**: Family networking and sharing
- **Integration Ecosystem**: Third-party service integrations

---

## 📋 Key Implementation Notes

### **Critical Security Measures**
1. **Email Masking**: All profile access includes automatic email masking for privacy
2. **Secure Functions**: Database access only through security definer functions
3. **Rate Limiting**: Comprehensive authentication and API rate limiting
4. **MFA Protection**: Encrypted MFA secret storage and secure backup codes
5. **Audit Trails**: Complete logging of all security-sensitive operations

### **Development Guidelines**
1. **Security First**: Always consider security implications
2. **Type Safety**: Full TypeScript implementation
3. **Component Modularity**: Reusable, focused components
4. **Performance**: Optimized for fast loading and responsiveness
5. **Accessibility**: WCAG compliance and inclusive design

### **Database Best Practices**
1. **RLS Policies**: Comprehensive row-level security
2. **Secure Functions**: All data access through secure functions
3. **Data Validation**: Server-side validation for all inputs
4. **Audit Logging**: Complete action history tracking
5. **Performance**: Optimized queries and proper indexing

---

This knowledge document represents the complete architecture, security implementation, and feature set of the ChoreQuest application as of 2025. The application demonstrates enterprise-grade security practices while maintaining a user-friendly, gamified experience for family chore management.

## 🏷️ Document Tags
`#chorquest` `#react` `#supabase` `#security` `#gamification` `#family-management` `#typescript` `#analytics` `#authentication` `#database` `#rls` `#mfa` `#monitoring`