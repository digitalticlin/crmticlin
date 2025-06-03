
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SalesFunnel from "./pages/SalesFunnel";
import WhatsAppChat from "./pages/WhatsAppChat";
import Clients from "./pages/Clients";
import Automation from "./pages/Automation";
import Integration from "./pages/Integration";
import AIAgents from "./pages/AIAgents";
import Plans from "./pages/Plans";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import GlobalAdmin from "./pages/GlobalAdmin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import ConfirmEmailInstructions from "./pages/ConfirmEmailInstructions";
import VPSDiagnostic from "./pages/VPSDiagnostic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                <Route path="/confirm-email-instructions" element={<ConfirmEmailInstructions />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/sales-funnel" element={
                  <ProtectedRoute>
                    <SalesFunnel />
                  </ProtectedRoute>
                } />
                
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <WhatsAppChat />
                  </ProtectedRoute>
                } />
                
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                } />
                
                <Route path="/automation" element={
                  <ProtectedRoute>
                    <Automation />
                  </ProtectedRoute>
                } />
                
                <Route path="/integration" element={
                  <ProtectedRoute>
                    <Integration />
                  </ProtectedRoute>
                } />
                
                <Route path="/ai-agents" element={
                  <ProtectedRoute>
                    <AIAgents />
                  </ProtectedRoute>
                } />
                
                <Route path="/plans" element={
                  <ProtectedRoute>
                    <Plans />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/team" element={
                  <ProtectedRoute>
                    <Team />
                  </ProtectedRoute>
                } />
                
                <Route path="/global-admin" element={
                  <ProtectedRoute>
                    <GlobalAdmin />
                  </ProtectedRoute>
                } />
                
                <Route path="/vps-diagnostic" element={
                  <ProtectedRoute>
                    <VPSDiagnostic />
                  </ProtectedRoute>
                } />
                
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
