import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function AdminLayout() {
  const { profile, signOut } = useAdminAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-admin-background text-white dark">
        <AdminSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Admin Header */}
          <header className="h-16 border-b border-admin-primary/20 bg-admin-background/80 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-admin-primary">🥷 Chore Ninja Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">{profile?.display_name}</span>
                <span className="text-admin-primary/70 capitalize">
                  ({profile?.role?.replace('_', ' ')})
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-admin-primary/20 hover:bg-admin-primary/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}