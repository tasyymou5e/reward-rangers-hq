import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminBridge } from "@/hooks/useAdminBridge";
import { UserManagementTab } from "@/components/UserManagementTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Users, Search, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsers() {
  const { loading: isLoading, canManageUsers } = useAdminBridge();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  if (isLoading) {
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
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search & Filter Users
              </span>
              {(searchTerm || roleFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="full_admin">Full Admin</SelectItem>
                  <SelectItem value="read_only_admin">Read Only Admin</SelectItem>
                  <SelectItem value="report_admin">Report Admin</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="kid">Kid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Management Component */}
        <ErrorBoundary componentName="UserManagementTab">
          <UserManagementTab searchTerm={searchTerm} roleFilter={roleFilter} />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}