# ChoreQuest - Architecture & Technology Stack

## 🏗️ System Architecture

### Frontend Framework
- **React 18.3.1** with TypeScript for type safety
- **Vite** as build tool and development server
- **React Router DOM** for client-side routing (Hash routing)
- **Single Page Application** with role-based route protection

### Backend Services
- **Supabase** comprehensive backend-as-a-service:
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions for live data
  - Authentication system with email/password
  - Edge Functions for custom business logic
  - Security monitoring and rate limiting

### Styling & UI
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** component library with Radix UI primitives
- **Custom design system** with semantic tokens
- **Role-based theming** for different user types

---

## 📦 Core Dependencies

### State Management & Data Fetching
```json
{
  "@tanstack/react-query": "^5.83.0",  // Server state management
  "@supabase/supabase-js": "^2.56.0",   // Backend integration
  "react-hook-form": "^7.61.1",         // Form management
  "zod": "^3.25.76"                     // Schema validation
}
```

### UI & Visualization
```json
{
  "lucide-react": "^0.462.0",           // Icon system
  "recharts": "^2.15.4",               // Data visualization
  "sonner": "^1.7.4",                  // Toast notifications
  "class-variance-authority": "^0.7.1"  // Component variants
}
```

### Business Logic
```json
{
  "jspdf": "^3.0.2",                   // PDF report generation
  "jspdf-autotable": "^5.0.2",         // PDF table formatting
  "date-fns": "^3.6.0"                 // Date manipulation
}
```

---

## 🔧 State Management Strategy

### Server State (React Query)
- **Automatic Caching**: Reduces unnecessary API calls
- **Background Updates**: Keeps data fresh automatically
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Built-in retry logic and fallbacks
- **Query Invalidation**: Smart cache management

### Client State (React Context + useState)
- **Authentication**: User session and profile management
- **UI State**: Modals, notifications, loading states
- **Feature Flags**: A/B test assignments and toggles
- **User Preferences**: Settings and customizations

### Real-time Updates (Supabase Subscriptions)
- **Live Data**: Chore completions and family activity
- **Instant Notifications**: Real-time feedback for actions
- **Collaborative Features**: Multi-user interaction support
- **Conflict Resolution**: Handles concurrent data updates

---

## 🗄️ Database Design

### Core Architecture
- **PostgreSQL** with advanced features
- **Row Level Security (RLS)** on all tables
- **Custom Functions** for complex business logic
- **Triggers** for automatic data management
- **Real-time subscriptions** for live updates

### Security Functions
```sql
-- Family access validation
validate_family_access(family_id, user_id, required_role)

-- Safe profile access
get_safe_family_profiles(requesting_user_id)

-- Security event logging
log_security_event(event_type, user_id, metadata)

-- Authentication rate limiting
check_auth_rate_limit(ip_addr, email, max_attempts, block_duration)
```

### Key Relationships
- **Users → Families**: Many-to-many via family_members
- **Families → Chores**: One-to-many with assignment tracking
- **Users → Progress**: Activity logging and analytics
- **Users → Wishlist**: Goal setting with approval workflow

---

## 🔐 Security Architecture

### Authentication Layer
- **Supabase Auth** for user management
- **Multi-Factor Authentication** for parents
- **Temporary passwords** for child invitations
- **Session management** with automatic refresh

### Authorization Layer
- **Row Level Security** policies on all tables
- **Role-based access control** (parent, kid, admin)
- **Family-scoped permissions** for data isolation
- **Security functions** to prevent recursive issues

### Monitoring & Protection
- **Rate limiting** for authentication attempts
- **Security event logging** for audit trails
- **IP-based access controls** for suspicious activity
- **Automated alerting** for security violations

---

## 📡 API Integration

### Supabase Services
- **Database**: PostgreSQL with custom functions
- **Authentication**: Email/password with MFA support
- **Real-time**: Live data subscriptions
- **Edge Functions**: Custom business logic
- **Security**: Monitoring and rate limiting

### Edge Functions
```typescript
// User creation and email invitations
supabase/functions/invite-child/

// User account setup
supabase/functions/create-user/

// Development family creation
supabase/functions/create-test-family/

// Security event tracking
supabase/functions/security-monitor/
```

### External Services
- **Resend**: Professional email delivery for invitations
- **jsPDF**: Client-side PDF generation for reports

---

## 🚀 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Lazy loading for route components
- **Component Composition**: Small, focused components
- **Custom Hooks**: Feature logic abstraction
- **Efficient Re-renders**: Optimized React patterns

### Backend Optimization
- **Database Indexes**: Optimized query performance
- **Bulk Operations**: Efficient multi-record operations
- **Caching Strategy**: React Query with smart invalidation
- **Real-time Efficiency**: Selective subscription management

### Build Optimization
- **Vite**: Fast development and optimized production builds
- **Tree Shaking**: Eliminates unused code
- **Asset Optimization**: Compressed images and resources
- **Bundle Analysis**: Regular size monitoring

---

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: Loading, interactivity, visual stability
- **Error Tracking**: Production error monitoring
- **User Analytics**: Feature usage and engagement metrics
- **Security Monitoring**: Threat detection and response

### Business Intelligence
- **Family Engagement**: Activity patterns and trends
- **Feature Adoption**: A/B testing and rollout metrics
- **System Health**: Database performance and uptime
- **User Feedback**: Satisfaction and improvement areas

---

## 🔄 Development Workflow

### Environment Configuration
- **Development**: Local Supabase with test data
- **Staging**: Production-like environment for testing
- **Production**: Live system with real families

### Deployment Pipeline
- **Automatic Builds**: Triggered by code changes
- **Environment Variables**: Secure configuration management
- **Database Migrations**: Version-controlled schema changes
- **Edge Function Deployment**: Automatic function updates

---

*This architecture supports ChoreQuest's current needs while providing scalability for future growth. For implementation details, see the Development Guide and Components documentation.*