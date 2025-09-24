# ChoreQuest - Component Architecture & Documentation

## 🧩 Component Overview

ChoreQuest features a comprehensive component architecture built with React, TypeScript, and accessibility-first design principles. The platform contains 100+ components organized into clear categories for maximum reusability and maintainability.

### Component Statistics
- **Total Components**: 100+
- **Page Components**: 15+ (route-based components)
- **Feature Components**: 35+ (business logic components)  
- **UI Components**: 45+ (reusable interface elements)
- **Custom Hooks**: 25+ (logic abstraction)
- **Zustand Stores**: 6 (centralized state management)

---

## 📄 Page Components

### Admin Portal Pages (`src/pages/admin/`)

#### AdminDashboard.tsx
```typescript
// Central admin control panel with system overview
interface AdminDashboardProps {
  systemMetrics: SystemHealth;
  userMetrics: UserMetrics;
  familyMetrics: FamilyMetrics;
}

Features:
- KPI cards showing user, family, and system metrics
- Quick action buttons for common admin tasks
- System health status with real-time monitoring
- Recent activity feed and error alerts
```

#### AdminUsers.tsx
```typescript
// Comprehensive user management interface
interface AdminUsersState {
  users: User[];
  selectedUsers: string[];
  searchTerm: string;
  filterRole: string;
  sortField: string;
}

Key Components:
- UserViewDialog: Comprehensive user detail display
- UserEditDialog: Full user profile and role editing
- UserDeleteDialog: Safe user deletion with cascade handling
- UserPasswordResetDialog: Admin-controlled password reset
```

#### AdminFamilies.tsx
```typescript
// Family management and oversight interface
Features:
- Family listing with search and filtering
- Bulk family creation for testing environments
- Family member management and role assignment
- Family statistics and activity monitoring

Components:
- CreateTestFamilyButton: Bulk family creation
- CreateTestFamilyDialog: Configurable test family creation
- FamilyViewDialog: Detailed family information
- FamilyEditDialog: Family information editing
```

#### AdminSystemSettings.tsx ✨ NEW
```typescript
// System configuration and portal control interface
interface SystemSettingsState {
  loginControls: {
    parents_login_enabled: boolean;
    kids_login_enabled: boolean;
    maintenance_message: string;
  };
  systemMaintenance: {
    enabled: boolean;
    message: string;
  };
}

Features:
- Portal access control (parents/kids login toggle)
- System-wide maintenance mode management
- Custom messaging for disabled portals
- Real-time configuration updates
- Admin audit trail for all changes

Route: /admin/system-settings
Security: Full admin role required
Integration: system_settings database table, useSystemSettings hook
```

#### AdminLayout.tsx
```typescript
// Admin portal layout with role-based navigation
Features:
- AdminSidebar with role-based menu filtering
- Header with user profile and logout
- Breadcrumb navigation
- Responsive design with sidebar collapsing

Admin Roles Supported:
- admin, full_admin: Full access to all sections
- read_only_admin: Limited to viewing functions
- report_admin: Access to reports and analytics only
```

#### AdminAuth.tsx
```typescript
// Secure admin authentication interface
Features:
- Enhanced security with password visibility toggle
- Rate limiting protection display
- Professional admin-themed design
- Redirect to dashboard on successful auth
- Error handling with user-friendly messages

Route: /#/admin/auth
Security: Rate limiting, input validation, activity logging
```

### General Application Pages (`src/pages/`)

#### Index.tsx
```typescript
// Landing page with portal selection
Features:
- Hero section with product information
- Role-based portal cards with descriptions
- Platform overview and feature highlights
- Getting started guidance for new families
```

#### Auth.tsx
```typescript
// Universal authentication interface
Features:
- Unified login/signup forms with role detection
- Password strength indicators and validation
- Account recovery and password reset
- Security banners with context-aware messaging
```

---

## 🏗️ Feature Components

### Admin Components (`src/components/admin/`)

#### AdminSidebar.tsx ✨ UPDATED
```typescript
// Role-based admin navigation with dynamic menu filtering
interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: string[]; // Allowed admin roles for this item
}

Features:
- Role-based menu item filtering
- Active route highlighting with legacy route compatibility
- Collapsible sidebar with icon-only mode
- Quick actions section with "Back to Home" link
- Professional admin theming

Navigation Items:
- Dashboard: All admin roles
- Users: admin, full_admin only  
- Families: admin, full_admin, read_only_admin
- Reports: admin, full_admin, report_admin
- Content: admin, full_admin only
- System Monitoring: admin, full_admin only
- Security Center: admin, full_admin only
- System Settings: admin, full_admin only ✨ NEW
```

#### SecurityMonitoringDashboard.tsx
```typescript
interface SecurityDashboardState {
  alerts: SecurityAlert[];
  events: SecurityEvent[];
  selectedSeverity: string;
  activeTab: 'overview' | 'alerts' | 'events';
}

Features:
- Real-time security event monitoring
- Alert filtering by severity and type
- Security metrics with trend analysis
- Incident response workflow integration
```

#### EnhancedAdminDashboard.tsx
```typescript
// Comprehensive admin system overview
Features:
- System health monitoring with real-time updates
- User and family analytics with trend visualization
- Performance metrics dashboard
- Security status overview with alerts
```

#### AdminProtectedRoute.tsx ✨ UPDATED
```typescript
// Enhanced route protection with multi-role support
interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

Features:
- Multi-role admin support (admin, full_admin, read_only_admin, report_admin)
- Loading states with admin-themed spinner
- Automatic redirect to /admin/auth for unauthorized access
- Clean error boundaries and fallback UI

Security: Accepts all admin role types for comprehensive access control
```

### Authentication Components (`src/components/auth/`)

#### PasswordStrengthIndicator.tsx
```typescript
interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

Features:
- Real-time password validation with scoring
- Visual strength indicators with color coding
- Detailed requirements checklist with icons
- Leaked password detection via HaveIBeenPwned API
- Accessibility-focused feedback for users with autism
```

### User Management Components

#### UserManagementTab.tsx
```typescript
// Enhanced user management with secure operations
Features:
- User listing with advanced search and filtering
- Bulk operations for user management
- Role assignment with permission preview
- Secure confirmation dialogs replacing native prompts
- Activity logging for all user operations
```

#### ChildAccountManagement.tsx
```typescript
// COPPA-compliant child account management
Features:
- Minimal data collection interface
- Parental consent workflow
- Privacy settings configuration
- Enhanced security for child data protection
```

---

## 🎨 UI Components (`src/components/ui/`)

### Core UI Components

#### confirm-dialog.tsx ✨ SECURITY ENHANCEMENT
```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

Features:
- Secure replacement for native confirm() dialogs
- TypeScript safety with proper error handling
- Loading states for async operations
- Accessible with ARIA attributes
- Customizable variants for different use cases
```

#### dialog.tsx
```typescript
// Enhanced modal dialogs with security features
Components: Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle
Features:
- Modal dialogs with backdrop and focus management
- Responsive sizing with mobile optimization
- Animation transitions for smooth UX
- Escape key and click-outside dismissal
- Accessibility: Focus trapping, ARIA attributes
```

#### form.tsx
```typescript
// Secure form components with validation
Components: Form, FormField, FormItem, FormLabel, FormControl, FormMessage
Integration: React Hook Form with Zod validation schemas
Features:
- Real-time validation with contextual error messages
- Accessibility compliance with proper labeling
- Custom field components with reusable validation
- Form state persistence across navigation
```

#### sidebar.tsx ✨ ENHANCED
```typescript
// Collapsible sidebar navigation system
Components: Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem
Features:
- Collapsible navigation with icon-only mode
- Role-based menu item filtering
- Responsive design with mobile optimization
- Accessibility compliance with keyboard navigation
- Theme integration with semantic tokens
```

### Data Display Components

#### table.tsx
```typescript
// Optimized data tables with security features
Components: Table, TableHeader, TableBody, TableRow, TableCell
Features:
- Sortable columns with visual indicators
- Responsive design with horizontal scrolling
- Row selection with bulk actions
- Pagination integration with performance optimization
- Virtual scrolling for large datasets
```

#### card.tsx
```typescript
// Consistent content containers
Components: Card, CardHeader, CardContent, CardFooter, CardTitle
Variants: default, outlined, elevated, interactive
Features:
- Hover states and loading indicators
- Accessibility annotations
- Semantic design tokens integration
```

---

## 🎣 Custom Hooks

### System Management Hooks

#### useSystemSettings.ts ✨ NEW
```typescript
// System configuration management hook
interface SystemSettingsReturn {
  loginControls: LoginControls;
  systemMaintenance: SystemMaintenance;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

Features:
- Real-time system settings loading
- Error handling with fallback defaults
- Automatic retry on failure
- Type-safe configuration interfaces
- Integration with system_settings database table

Usage: AdminSystemSettings component, portal access control
```

### Authentication & Security Hooks

#### useSecureAuth.ts
```typescript
// Enhanced authentication with security features
interface SecureAuthState {
  authAttempts: number;
  blockUntil: number | null;
  isBlocked: boolean;
}

Features:
- Rate limiting with exponential backoff
- Security event logging with device fingerprinting
- IP-based attack detection
- Emergency logout capabilities
```

#### useSecureFamily.ts
```typescript
// Family data access with security validation
Features:
- Family boundary enforcement
- Access logging for audit trails
- Permission-based data filtering
- Real-time security monitoring
```

#### useSecureProfiles.ts
```typescript
// Secure profile data management
Features:
- Role-based profile access
- Data encryption for sensitive fields
- Activity logging for profile changes
- GDPR compliance utilities
```

### System & Monitoring Hooks

#### useSecurityMonitoring.ts
```typescript
// Real-time security monitoring and alerting
Features:
- Security event aggregation
- Threat pattern recognition
- Automated incident response
- Compliance reporting utilities
```

#### useAdminBridge.ts
```typescript
// Bridge adapter for admin functionality
Features:
- Backward compatibility with legacy admin hooks
- Enhanced error handling and logging
- Performance optimization with caching
- Security-first admin operations
```

---

## 🗄️ State Management (Zustand Architecture)

### Core Stores (`src/stores/`)

#### authStore.ts
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  sessionReady: boolean;
  
  // Enhanced Actions
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{error: AuthError | null}>;
  fetchUserRole: (userId: string) => Promise<string | null>;
  emergencyLogout: () => void;
}

Features:
- Race condition prevention
- Enhanced error diagnostics
- Comprehensive activity logging
- Session persistence with security
```

#### uiStore.ts
```typescript
interface UIState {
  loading: boolean;
  componentLoading: Record<string, boolean>;
  errors: Record<string, string>;
  notifications: Notification[];
  modals: Record<string, boolean>;
  
  // Performance tracking
  renderCount: number;
  lastRender: number;
}

Features:
- Component-specific loading states
- Centralized error management
- Performance monitoring integration
- Selective subscription optimization
```

#### adminStore.ts
```typescript
interface AdminState {
  systemHealth: SystemHealth;
  userMetrics: UserMetrics;
  familyMetrics: FamilyMetrics;
  securityMetrics: SecurityMetrics;
  selectedUsers: string[];
  selectedFamilies: string[];
}

Features:
- Real-time system monitoring
- Bulk operations support
- Security metrics integration
- WebSocket updates for live data
```

#### choreStore.ts
```typescript
// Task management and assignment tracking
Features:
- Chore lifecycle management
- Assignment tracking with real-time updates
- Gamification integration
- Recurring chore automation
```

#### gamificationStore.ts
```typescript
// Points, achievements, and progress tracking
Features:
- Points and XP management
- Achievement unlock system
- Leaderboard management
- Streak tracking
```

#### analyticsStore.ts
```typescript
// System analytics and reporting
Features:
- Engagement metrics tracking
- Performance analytics
- User behavior analysis
- Report generation support
```

---

## 🎯 Design System Integration

### Semantic Token Usage
```css
/* Components use semantic tokens from index.css */
--primary: 213 94% 68%;        /* Blue for primary actions */
--secondary: 210 40% 96%;      /* Light gray for secondary */
--success: 142 69% 58%;        /* Green for success states */
--warning: 25 95% 65%;         /* Orange for warnings */
--destructive: 0 84.2% 60.2%;  /* Red for errors */

/* Admin-specific tokens */
--admin-primary: 215 28% 17%;  /* Dark blue */
--admin-secondary: 210 40% 96%; /* Light gray */
--admin-background: 0 0% 98%;   /* Very light background */
```

### Component Variants
```typescript
// Using class-variance-authority for type-safe styling
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    }
  }
);
```

---

## 🔒 Security Features in Components

### Secure Component Patterns
```typescript
// Security-aware component template
interface SecureComponentProps {
  requiredRole?: 'admin' | 'parent' | 'kid' | 'full_admin' | 'read_only_admin' | 'report_admin';
  resourceId?: string;
  fallbackComponent?: React.ComponentType;
}

const SecureComponent: React.FC<SecureComponentProps> = ({
  requiredRole,
  resourceId,
  fallbackComponent: Fallback = AccessDenied,
  children
}) => {
  const { user, userRole } = useAuthStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !userRole) {
        setHasAccess(false);
        return;
      }
      
      if (!requiredRole) {
        setHasAccess(true);
        return;
      }
      
      const access = await checkUserRole(user.id, requiredRole);
      setHasAccess(access);
    };
    
    checkAccess();
  }, [user, userRole, requiredRole, resourceId]);
  
  if (hasAccess === null) return <LoadingSpinner />;
  if (!hasAccess) return <Fallback />;
  
  return <>{children}</>;
};
```

### Input Validation Components
```typescript
// Secure input components with validation
const SecureInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [value, setValue] = useState('');
    const [isValid, setIsValid] = useState(true);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = sanitizeInput(e.target.value);
      setValue(sanitizedValue);
      setIsValid(validateInput(sanitizedValue, type));
      props.onChange?.(e);
    };
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
          !isValid && "border-destructive",
          className
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
```

---

## 📊 Component Performance Metrics

### Performance Optimizations
- **Component Memoization**: Strategic use of React.memo for expensive components
- **Selective Subscriptions**: Zustand store subscriptions only to needed state slices
- **Code Splitting**: Lazy loading for admin portal and heavy components
- **Virtual Scrolling**: For large data tables and lists

### Bundle Optimization
- **Tree Shaking**: Eliminates unused component code
- **Dynamic Imports**: Route-based code splitting
- **Component Composition**: Small, focused components over monolithic structures

---

## 🚀 Recent Component Updates

### System Settings Implementation
- **AdminSystemSettings**: Complete portal control interface
- **useSystemSettings**: Real-time configuration management
- **AdminSidebar**: Enhanced with role-based filtering and new System Settings navigation

### Security Enhancements
- **ConfirmDialog**: Secure replacement for native browser dialogs
- **AdminProtectedRoute**: Multi-role admin support
- **Enhanced Error Boundaries**: Better error handling across admin components

### UI Improvements
- **Responsive Design**: All components optimized for mobile and desktop
- **Accessibility**: WCAG 2.1 AA compliance across all components
- **Design System**: Consistent use of semantic tokens and variants

---

*This component architecture supports ChoreQuest's comprehensive feature set with 100+ components, A- security grade, and modern React patterns. All components follow security-first principles and accessibility best practices.*