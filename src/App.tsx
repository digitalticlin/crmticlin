
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
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
import VPSDiagnostic from "./pages/VPSDiagnostic";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
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
              <Route
                path="/vps-diagnostic"
                element={
                  <ProtectedRoute>
                    <VPSDiagnostic />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
