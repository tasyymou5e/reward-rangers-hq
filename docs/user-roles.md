# ChoreQuest - User Roles & Portals

## 🎭 Overview

ChoreQuest provides distinct portal experiences, each tailored to specific user roles and their unique needs within the family chore management ecosystem. The system now includes dynamic portal access control managed by administrators.

---

## 👶 Kids Portal (`/kids`)

### Target Users
Children and teenagers who complete household chores and participate in the family system.

### Core Features

#### Gamification Elements
- **Points & XP System**: Earn 10-50 points based on chore difficulty
- **Level Progression**: `Math.floor(points / 100) + 1` calculation
- **Achievement Badges**: Milestone rewards for consistency and challenges
- **Streak Tracking**: Daily completion streaks with bonus multipliers
- **Leaderboard**: Family-wide competition and recognition

#### Interactive Experience
- **Chore Timer**: Visual countdown with progress indicators
- **Mini-Games**: Post-completion bonus activities (5-20 additional points)
- **Confetti Celebrations**: Visual rewards for completed tasks
- **Motivation Journal**: Personal reflection and goal setting
- **Calendar View**: Visual schedule of upcoming tasks

#### Goal Setting
- **Wishlist Management**: Create and track personal reward goals
- **Progress Visualization**: Visual indicators of goal achievement
- **Parent Approval**: Workflow for reward validation
- **Achievement Tracking**: Historical view of completed goals

### Design Theme
- **Bright Colors**: Purple, teal, yellow, and green palette
- **Playful Animations**: Bounce effects and smooth transitions
- **Emoji Integration**: Extensive use for visual communication
- **Kid-Friendly Typography**: Large, readable fonts with fun elements

### Access Control ✨ NEW
- **Admin Controlled**: Can be enabled/disabled via System Settings
- **Dynamic Messaging**: Custom messages when portal is disabled
- **Real-time Changes**: Settings apply immediately without restart

### User Flow Example
1. **Login** → Personal dashboard with assigned chores
2. **Select Task** → View details and start timer
3. **Complete** → Mark done and receive points
4. **Celebrate** → Confetti animation and mini-game
5. **Progress** → Update streak and check leaderboard

---

## 👨‍👩‍👧‍👦 Parents Portal (`/parents`)

### Target Users
Parent or guardian who manages family chores, assigns tasks, and oversees children's progress.

### Core Features

#### Family Management
- **Real Family Dashboard**: Live display of actual children with profiles
- **Child Progress Tracking**: Individual XP, levels, streaks, and statistics
- **Family Statistics**: Real-time counts of active children and task completion
- **Member Management**: Add, remove, and modify family member access

#### Child Invitation System
- **Email Invitations**: Send professional branded invitations
- **Temporary Passwords**: Secure initial access for children
- **Automated Setup**: Account creation and family assignment
- **Professional Templates**: ChoreQuest branded HTML emails
- **Security Validation**: Parent authorization and automatic cleanup

#### Chore Assignment
- **Individual Assignment**: Target specific children for tasks
- **Bulk Assignment**: Assign same chore to multiple children
- **Visual Selection**: Checkbox interface for child selection
- **Comprehensive Forms**: Title, description, points, difficulty, due dates
- **Time Estimation**: Help children plan their schedule

#### Monitoring & Analytics
- **Live Progress**: Real-time completion tracking
- **Completion Statistics**: Daily, weekly, and monthly summaries
- **Predictive Insights**: AI-powered family engagement analysis
- **Performance Trends**: Long-term pattern identification

#### Administrative Tools
- **Wishlist Approval**: Review and approve/reject child requests
- **Reward Management**: Create and manage family-specific rewards
- **Report Generation**: Weekly PDF exports with charts and summaries
- **MFA Setup**: Enhanced security for parent accounts
- **Security Monitoring**: Access to family security events

### Design Theme
- **Professional Palette**: Calm green and blue tones
- **Productivity Focus**: Clean, organized interface design
- **Data-Driven**: Charts, graphs, and statistical displays
- **Trustworthy**: Secure and reliable visual elements

### Access Control ✨ NEW
- **Admin Controlled**: Can be enabled/disabled via System Settings
- **Dynamic Messaging**: Custom messages when portal is disabled
- **Real-time Changes**: Settings apply immediately without restart

### User Flow Example
1. **Dashboard** → Review family progress and statistics
2. **Create Chore** → Assign task to specific children
3. **Monitor** → Track completion and provide feedback
4. **Review** → Approve wishlist items and rewards
5. **Report** → Generate weekly family progress summary

---

## 🛠️ Admin Portal (`/admin`)

### Target Users
System administrators who manage the ChoreQuest platform across all families.

### Core Features

#### User Management
- **Family Oversight**: View and manage all families in the system
- **User Administration**: Create, modify, and deactivate accounts
- **Role Management**: Assign and modify user permissions (multi-role support)
- **Bulk Operations**: Efficient management of multiple records

#### System Configuration ✨ NEW
- **Portal Access Control**: Enable/disable parent and kids portals independently
- **Maintenance Mode**: System-wide maintenance with custom messaging
- **Dynamic Settings**: Real-time configuration changes via System Settings
- **Setting Categories**: Login controls, maintenance mode, and more

#### System Analytics
- **Platform-Wide Metrics**: Usage statistics and engagement data
- **Performance Monitoring**: System health and response times
- **Feature Adoption**: Track usage of different platform features
- **Growth Analytics**: User acquisition and retention metrics

#### Security Management
- **Security Monitoring**: Real-time threat detection and alerts
- **Audit Trails**: Comprehensive logging of all system activities
- **Access Control**: Manage IP restrictions and rate limiting
- **Incident Response**: Tools for investigating security events

#### Feature Management
- **A/B Testing**: Create and manage feature experiments
- **Feature Flags**: Control rollout of new functionality
- **Configuration**: System-wide settings and parameters
- **Update Management**: Deploy and rollback system changes

#### Business Operations
- **Affiliate Management**: Oversee partner integrations
- **Report Generation**: System-wide analytics and summaries
- **Support Tools**: User assistance and troubleshooting
- **Data Management**: Backup, recovery, and maintenance

### Admin Role Types ✨ ENHANCED
- **admin**: Full system access (legacy compatibility)
- **full_admin**: Complete administrative privileges
- **read_only_admin**: View-only access to most sections
- **report_admin**: Limited to reports and analytics

### Design Theme
- **Dark Professional**: Dark blue and gray color scheme
- **Data-Dense**: Efficient information display
- **Control-Focused**: Emphasis on management tools
- **Enterprise-Grade**: Robust and reliable interface

### Access Control
- **Always Available**: Admin portal access is always enabled
- **Role-Based Navigation**: Menu items filtered by admin role type
- **Secure Authentication**: Enhanced security with rate limiting

### User Flow Example
1. **Dashboard** → System overview and key metrics
2. **Configure** → Manage portal access and system settings
3. **Monitor** → Review security alerts and system health
4. **Manage** → Administer users and families
5. **Report** → Generate system-wide analytics

---

## 🔐 Role-Based Security

### Access Control
- **Authentication**: Role-specific login flows
- **Authorization**: Feature access based on user role
- **Data Isolation**: Family-scoped data access
- **Security Policies**: Row-level security enforcement

### Permission Matrix

| Feature | Kids | Parents | Admin Types |
|---------|------|---------|-------------|
| View Own Profile | ✅ | ✅ | ✅ |
| View Family Profiles | ✅ | ✅ | ✅ |
| Create Chores | ❌ | ✅ | ✅ |
| Complete Chores | ✅ | ❌ | ✅ |
| Manage Family | ❌ | ✅ | ✅ |
| System Administration | ❌ | ❌ | Role-based |
| Security Monitoring | ❌ | Limited | ✅ |
| A/B Testing | ❌ | ❌ | admin, full_admin |
| System Settings | ❌ | ❌ | admin, full_admin |
| Portal Control | ❌ | ❌ | admin, full_admin |

### Security Features
- **Multi-Factor Authentication**: Required for parents
- **Session Management**: Automatic timeout and refresh
- **Rate Limiting**: Protection against brute force attacks
- **Audit Logging**: Comprehensive activity tracking

---

## 🎛️ Portal Access Management ✨ NEW

### Dynamic Portal Control
Administrators can now control portal access in real-time through the System Settings interface:

#### Login Controls
```json
{
  "parents_login_enabled": true,
  "kids_login_enabled": true,
  "maintenance_message": "Custom message for disabled portals"
}
```

#### System Maintenance
```json
{
  "enabled": false,
  "message": "System is currently under maintenance. Please try again later."
}
```

### Implementation Details
- **Real-time Updates**: Changes apply immediately across the system
- **Custom Messaging**: Administrators can provide specific messages for disabled portals
- **Audit Trail**: All setting changes are logged with admin user tracking
- **Fallback Protection**: System maintains default values if settings are unavailable

### Use Cases
- **Scheduled Maintenance**: Temporarily disable user access during updates
- **Emergency Situations**: Quickly restrict access during security incidents
- **Phased Rollouts**: Gradually enable features for different user types
- **Load Management**: Reduce system load by limiting portal access

---

## 🎨 Portal Customization

### Theming System
Each portal uses role-specific themes defined in the design system:

```css
/* Kids Theme - Bright & Playful */
--kids-primary: 268 76% 62% (Purple)
--kids-secondary: 172 76% 55% (Teal)
--kids-accent: 45 93% 58% (Yellow)

/* Parents Theme - Calm & Professional */
--parents-primary: 142 71% 45% (Green)
--parents-secondary: 200 98% 39% (Blue)
--parents-accent: 39 84% 56% (Orange)

/* Admin Theme - Professional */
--admin-primary: 215 28% 17% (Dark blue)
--admin-secondary: 210 40% 96% (Light gray)
--admin-accent: 221 83% 53% (Blue)
```

### Navigation Patterns
- **Kids**: Large buttons with icons and animations
- **Parents**: Traditional navigation with breadcrumbs
- **Admin**: Collapsible sidebar navigation with role-based filtering

---

## 🔄 Portal Routing

### URL Structure (HashRouter)
- **Kids Portal**: `/#/kids`
- **Parents Portal**: `/#/parents`
- **Admin Portal**: `/#/admin/*`
- **Admin Login**: `/#/admin/auth`

### Route Protection
- **Portal Access Control**: Routes check system settings before allowing access
- **Role-based Navigation**: Automatic redirection based on user role and permissions
- **Maintenance Mode**: Global maintenance page when system-wide maintenance is enabled

---

*Each portal is designed to optimize the user experience for its specific audience while maintaining consistent data and security standards across the platform. The new portal access control system provides administrators with flexible management capabilities for different operational scenarios.*