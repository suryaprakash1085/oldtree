import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { setTokenErrorCallback } from "@/lib/api";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import SuperAdminLogin from "./pages/auth/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import ClientAdminDashboard from "./pages/client-admin/Dashboard";
import StorefrontHome from "./pages/storefront/Home";
import Checkout from "./pages/storefront/Checkout";
import Blog from "./pages/storefront/Blog";
import BlogDetail from "./pages/storefront/BlogDetail";
import PageDetail from "./pages/storefront/PageDetail";

const queryClient = new QueryClient();

function AppRoutes() {
  const { handleTokenError } = useAuth();

  // Setup token error callback
  useEffect(() => {
    setTokenErrorCallback(() => {
      handleTokenError();
    });
  }, [handleTokenError]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/auth/super-admin-login" element={<SuperAdminLogin />} />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/*"
        element={
          <ProtectedRoute>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Client Admin Routes */}
      <Route
        path="/client-admin/:tenantId"
        element={
          <ProtectedRoute>
            <ClientAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client-admin/:tenantId/*"
        element={
          <ProtectedRoute>
            <ClientAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Storefront Routes */}
      <Route path="/store/:tenantId" element={<StorefrontHome />} />
      <Route path="/store/:tenantId/checkout" element={<Checkout />} />
      <Route path="/store/:tenantId/blog" element={<Blog />} />
      <Route path="/store/:tenantId/blog/:slug" element={<BlogDetail />} />
      <Route path="/store/:tenantId/pages/:slug" element={<PageDetail />} />
      <Route path="/store/:tenantId/*" element={<StorefrontHome />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
