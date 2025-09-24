# Admin Portal URLs Reference

## Overview
This document provides a complete reference for all admin portal URLs in the Chatterbox application. The admin portal uses clean URLs with BrowserRouter for better user experience and SEO.

## Base URL
**Production/Preview**: `https://preview--choreninja.lovable.app`

## Admin Portal URLs

### Authentication
- **Admin Login**: `/admin/auth` or `/admin/login`
  - Full URL: `https://preview--choreninja.lovable.app/admin/auth`
  - Alternate: `https://preview--choreninja.lovable.app/admin/login`
  - Purpose: Secure admin authentication portal

### Dashboard & Main Areas
- **Admin Dashboard**: `/admin` (auto-redirects to dashboard)
  - Full URL: `https://preview--choreninja.lovable.app/admin`
  - Purpose: Main admin landing page with system overview

- **Direct Dashboard**: `/admin/dashboard`
  - Full URL: `https://preview--choreninja.lovable.app/admin/dashboard`
  - Purpose: Direct access to admin dashboard

### Management Sections
- **Users Management**: `/admin/users`
  - Full URL: `https://preview--choreninja.lovable.app/admin/users`
  - Purpose: User account management, roles, and permissions

- **Families Management**: `/admin/families`
  - Full URL: `https://preview--choreninja.lovable.app/admin/families`
  - Purpose: Family group management and oversight

- **Content Management**: `/admin/content`
  - Full URL: `https://preview--choreninja.lovable.app/admin/content`
  - Purpose: Educational content moderation and approval

### Analytics & Reporting
- **Reports**: `/admin/reports`
  - Full URL: `https://preview--choreninja.lovable.app/admin/reports`
  - Purpose: System analytics and administrative reports

### System Administration
- **System Monitoring**: `/admin/system-monitoring`
  - Full URL: `https://preview--choreninja.lovable.app/admin/system-monitoring`
  - Purpose: Real-time system health and performance monitoring

- **System Settings**: `/admin/system-settings`
  - Full URL: `https://preview--choreninja.lovable.app/admin/system-settings`
  - Purpose: System configuration and global settings

- **Security Center**: `/admin/security-center`
  - Full URL: `https://preview--choreninja.lovable.app/admin/security-center`
  - Purpose: Security monitoring, audit trails, and threat analysis

## Route Protection
All admin routes are protected by:
- **AdminAuthProvider**: Manages admin authentication state
- **AdminProtectedRoute**: Validates admin permissions
- **Role-based access**: Verifies admin privileges

## Navigation Structure
The admin portal uses a nested route structure:
```
/admin (AdminLayout wrapper)
├── /dashboard (default)
├── /users
├── /families
├── /reports
├── /content
├── /system-monitoring
├── /system-settings
└── /security-center
```

## Technical Notes
- Uses **BrowserRouter** for clean URLs (no hash routing)
- **SPA fallback** configured via `_redirects` file
- All routes require admin authentication
- Automatic redirection to login if not authenticated
- Session persistence across page refreshes

## Access Requirements
- Valid admin account credentials
- Admin role verification
- Active session with proper permissions
- Network connectivity for real-time features

## Troubleshooting
If admin URLs redirect to homepage:
1. Verify admin authentication
2. Check role permissions
3. Clear browser cache/cookies
4. Ensure proper network connectivity
5. Check for JavaScript errors in console

---
**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: Development Team