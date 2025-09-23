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
import KidsPortal from "./pages/KidsPortal";
import ParentsPortal from "./pages/ParentsPortal";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { FeedbackWidget } from "./components/FeedbackWidget";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4 p-8 max-w-md">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">Application Error</h1>
            <p className="text-gray-600">
              Something went wrong. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  // App component rendering
  
  return (
    <ErrorBoundary>
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
                <Route path="/admin" element={
                  <AdminAuthProvider>
                    <AdminProtectedRoute>
                      <AdminPortal />
                    </AdminProtectedRoute>
                  </AdminAuthProvider>
                } />
                
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