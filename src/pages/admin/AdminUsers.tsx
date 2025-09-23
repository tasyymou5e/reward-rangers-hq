import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminBridge } from "@/hooks/useAdminBridge";
import { UserManagementTab } from "@/components/UserManagementTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Users, Search } from "lucide-react";

export default function AdminUsers() {
  const { loading, canManageUsers } = useAdminBridge();
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary componentName="AdminUsers">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-primary flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-admin-primary/70 mt-1">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Component */}
        <ErrorBoundary componentName="UserManagementTab">
          <UserManagementTab />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}