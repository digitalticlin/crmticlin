
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { QRCodeModalProvider } from "@/contexts/QRCodeModalContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ConfirmEmail from "@/pages/ConfirmEmail";

// Dashboard pages
import Dashboard from "@/pages/Dashboard";
import WhatsApp from "@/pages/WhatsApp";
import SalesFunnel from "@/pages/SalesFunnel";
import Clients from "@/pages/Clients";
import Automations from "@/pages/Automations";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  console.log('[App] 🚀 Inicializando aplicação');
  console.log('[App] 📍 Rota atual:', window.location.pathname);
  console.log('[App] ✅ Supabase exposto globalmente para debug');
  console.log('[App] ✅ BigQuery Optimizer carregado - ativará apenas se necessário');

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <QRCodeModalProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/confirm-email/:token?" element={<ConfirmEmail />} />

                {/* Protected Routes - wrapped with SidebarProvider */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Dashboard />
                    </SidebarProvider>
                  </ProtectedRoute>
                } />
                <Route path="/whatsapp" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <WhatsApp />
                    </SidebarProvider>
                  </ProtectedRoute>
                } />
                <Route path="/sales-funnel" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <SalesFunnel />
                    </SidebarProvider>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Clients />
                    </SidebarProvider>
                  </ProtectedRoute>
                } />
                <Route path="/automations" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Automations />
                    </SidebarProvider>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SidebarProvider>
                      <Settings />
                    </SidebarProvider>
                  </ProtectedRoute>
                } />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </QRCodeModalProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
