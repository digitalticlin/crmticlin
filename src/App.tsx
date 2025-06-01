
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Plans from "./pages/Plans";
import AIAgents from "./pages/AIAgents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SalesFunnel from "./pages/SalesFunnel";
import Chat from "./pages/Chat";
import Clients from "./pages/Clients";
import Automation from "./pages/Automation";
import Integration from "./pages/Integration";
import Register from "./pages/Register";
import ConfirmEmailInstructions from "./pages/ConfirmEmailInstructions";
import ConfirmEmail from "./pages/ConfirmEmail";
import GlobalAdmin from "./pages/GlobalAdmin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/confirm-email-instructions" element={<ConfirmEmailInstructions />} />
              <Route path="/confirm-email/:token" element={<ConfirmEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Rotas protegidas */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/sales-funnel" element={<ProtectedRoute><SalesFunnel /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
              <Route path="/integration" element={<ProtectedRoute><Integration /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
              <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><GlobalAdmin /></ProtectedRoute>} />
              
              {/* Rota de fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
