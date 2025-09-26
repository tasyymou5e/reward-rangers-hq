import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Settings,
  Activity,
  UserCog,
  FileText,
  Home,
  CheckSquare
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'full_admin', 'read_only_admin', 'report_admin']
  },
  {
    title: "Users",
    url: "/admin/users", 
    icon: Users,
    roles: ['admin', 'full_admin']
  },
  {
    title: "Families",
    url: "/admin/families",
    icon: UserCog,
    roles: ['admin', 'full_admin', 'read_only_admin']
  },
  {
    title: "Chore Templates",
    url: "/admin/chore-templates",
    icon: CheckSquare,
    roles: ['admin', 'full_admin']
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: BarChart3,
    roles: ['admin', 'full_admin', 'report_admin']
  },
  {
    title: "Content",
    url: "/admin/content",
    icon: FileText,
    roles: ['admin', 'full_admin']
  },
  {
    title: "System Monitoring",
    url: "/admin/system-monitoring", 
    icon: Activity,
    roles: ['admin', 'full_admin']
  },
  {
    title: "Security Center",
    url: "/admin/security-center",
    icon: Shield,
    roles: ['admin', 'full_admin']
  },
  {
    title: "System Settings",
    url: "/admin/system-settings",
    icon: Settings,
    roles: ['admin', 'full_admin']
  },
  {
    title: "Legacy Admin",
    url: "/admin",
    icon: Settings,
    roles: ['admin', 'full_admin', 'read_only_admin', 'report_admin']
  }
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { profile } = useAdminAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin/dashboard" && currentPath === "/admin") {
      return true; // Legacy route compatibility
    }
    return currentPath === path;
  };

  const hasRole = (requiredRoles: string[]) => {
    return profile?.role && requiredRoles.includes(profile.role);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-admin-primary/10 text-admin-primary font-medium border-r-2 border-admin-primary" 
      : "hover:bg-admin-primary/5 text-admin-secondary hover:text-admin-primary";

  // Keep main navigation group open if any item is active
  const isMainGroupExpanded = navigationItems.some(item => 
    hasRole(item.roles) && isActive(item.url)
  );

  const filteredItems = navigationItems.filter(item => hasRole(item.roles));

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent className="bg-admin-background border-r border-admin-primary/20">
        <SidebarGroup>
          <SidebarGroupLabel className="text-admin-primary font-semibold">
            Administration
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls({ isActive: isActive(item.url) })}
                    >
                      <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-admin-primary font-semibold">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/" 
                    className="hover:bg-admin-primary/5 text-admin-secondary hover:text-admin-primary"
                  >
                    <Home className="mr-3 h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Back to Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
