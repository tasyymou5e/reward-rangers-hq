import React from 'react';
import { HashRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminPortal from "./pages/AdminPortal";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContent from "./pages/admin/AdminContent";
import AdminFamilies from "./pages/admin/AdminFamilies";
import AdminReports from "./pages/admin/AdminReports";
import AdminSecurityCenter from "./pages/admin/AdminSecurityCenter";
import AdminSystemMonitoring from "./pages/admin/AdminSystemMonitoring";
import AdminUsers from "./pages/admin/AdminUsers";
import KidsPortal from "./pages/KidsPortal";
import ParentsPortal from "./pages/ParentsPortal";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { FeedbackWidget } from "./components/FeedbackWidget";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary componentName="App">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/kids" element={
                  <ProtectedRoute requiredRole="kid">
                    <KidsPortal />
                  </ProtectedRoute>
                } />
                <Route path="/parents" element={
                  <ProtectedRoute requiredRole="parent">
                    <ParentsPortal />
                  </ProtectedRoute>
                } />
                
                {/* Admin routes - separate authentication */}
                <Route path="/admin/login" element={
                  <AdminAuthProvider>
                    <AdminAuth />
                  </AdminAuthProvider>
                } />
                <Route path="/admin/auth" element={
                  <AdminAuthProvider>
                    <AdminAuth />
                  </AdminAuthProvider>
                } />
                
                {/* New Admin Layout Routes */}
                <Route path="/admin" element={
                  <AdminAuthProvider>
                    <AdminProtectedRoute>
                      <AdminLayout />
                    </AdminProtectedRoute>
                  </AdminAuthProvider>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="families" element={<AdminFamilies />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="system-monitoring" element={<AdminSystemMonitoring />} />
                  <Route path="security-center" element={<AdminSecurityCenter />} />
                </Route>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FeedbackWidget />
            </HashRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;