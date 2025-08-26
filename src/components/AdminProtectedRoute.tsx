import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, profile, loading } = useAdminAuth();

  console.log('AdminProtectedRoute check:', { 
    user: !!user, 
    profile: !!profile, 
    role: profile?.role, 
    loading 
  });

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

  if (!user || !profile || profile.role !== 'admin') {
    console.log('Redirecting to admin auth - not authorized');
    return <Navigate to="/admin/auth" replace />;
  }

  console.log('Admin access granted');
  return <>{children}</>;
}