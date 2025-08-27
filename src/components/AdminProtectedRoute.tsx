import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, profile, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-spin">⚙️</div>
          <p className="text-xl font-bold text-admin-primary">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Accept all admin role types for security fix
  const adminRoles = ['admin', 'full_admin', 'read_only_admin', 'report_admin'];
  if (!user || !profile || !adminRoles.includes(profile.role)) {
    return <Navigate to="/admin/auth" replace />;
  }

  return <>{children}</>;
}