
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import WhatsApp from "./pages/WhatsApp";
import Team from "./pages/Team";
import Plans from "./pages/Plans";
import AIAgents from "./pages/AIAgents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SalesFunnel from "./pages/SalesFunnel";
import Chat from "./pages/Chat";
import Automation from "./pages/Automation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales-funnel" element={<SalesFunnel />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/team" element={<Team />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/ai-agents" element={<AIAgents />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
