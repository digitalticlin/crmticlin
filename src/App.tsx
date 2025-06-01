import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import Leads from "@/pages/Leads";
import Admin from "@/pages/Admin";
import WhatsAppAdmin from "@/pages/WhatsAppAdmin";
import VPSDiagnostic from "@/pages/VPSDiagnostic";
import PrivateRoute from "@/components/auth/PrivateRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/leads" 
                element={
                  <PrivateRoute>
                    <Leads />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute>
                    <Admin />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/whatsapp" 
                element={
                  <PrivateRoute>
                    <WhatsAppAdmin />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/vps-diagnostic" 
                element={
                  <PrivateRoute>
                    <VPSDiagnostic />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
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
