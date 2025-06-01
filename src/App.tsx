
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import SalesFunnel from "@/pages/SalesFunnel";
import GlobalAdmin from "@/pages/GlobalAdmin";
import VPSDiagnostic from "@/pages/VPSDiagnostic";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Index />} />
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
                path="/leads" 
                element={
                  <ProtectedRoute>
                    <SalesFunnel />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <GlobalAdmin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/whatsapp" 
                element={
                  <ProtectedRoute>
                    <Settings />
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
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
