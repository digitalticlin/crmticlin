
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Index';
import Register from './pages/Register';
import AdminPanel from './pages/Admin';
import WhatsAppIntegration from './pages/Integration';
import FunnelsPage from './pages/SalesFunnel';
import LeadsPage from './pages/Clients';
import SettingsPage from './pages/Settings';
import WhatsAppWebPage from './pages/WhatsAppChat';
import GlobalAdmin from './pages/GlobalAdmin';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <AuthProvider>
            <SidebarProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/whatsapp" 
                  element={
                    <ProtectedRoute>
                      <WhatsAppIntegration />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/funnels" 
                  element={
                    <ProtectedRoute>
                      <FunnelsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leads" 
                  element={
                    <ProtectedRoute>
                      <LeadsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/whatsapp-web" 
                  element={
                    <ProtectedRoute>
                      <WhatsAppWebPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/whatsapp-chat" 
                  element={
                    <ProtectedRoute>
                      <WhatsAppWebPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/global-admin/*" 
                  element={
                    <ProtectedRoute>
                      <GlobalAdmin />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
