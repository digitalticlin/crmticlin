
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuthMonitoring } from "@/hooks/useAuthMonitoring";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import WhatsAppChat from "./pages/WhatsAppChat";
import SalesFunnel from "./pages/SalesFunnel";
import Settings from "./pages/Settings";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Plans from "./pages/Plans";
import Automation from "./pages/Automation";
import AIAgents from "./pages/AIAgents";
import Integration from "./pages/Integration";
import Register from "./pages/Register";
import GlobalAdmin from "./pages/GlobalAdmin";
import ConfirmEmail from "./pages/ConfirmEmail";
import ConfirmEmailInstructions from "./pages/ConfirmEmailInstructions";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Não fazer retry em erros de auth
        if (error && typeof error === 'object' && 'status' in error && 
            (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutos
    }
  }
});

// Componente interno para usar hooks do Router
function AppContent() {
  const { metrics } = useAuthMonitoring();
  
  // Log métricas periodicamente para debug
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (metrics.redirectCount > 0 || metrics.authStateChanges > 0) {
        console.log('[App] Auth metrics:', metrics);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/confirm-email-instructions" element={<ConfirmEmailInstructions />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatsapp-chat"
          element={
            <ProtectedRoute>
              <WhatsAppChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-funnel"
          element={
            <ProtectedRoute>
              <SalesFunnel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Team />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automation"
          element={
            <ProtectedRoute>
              <Automation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-agents"
          element={
            <ProtectedRoute>
              <AIAgents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integration"
          element={
            <ProtectedRoute>
              <Integration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/global-admin"
          element={
            <ProtectedRoute>
              <GlobalAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
