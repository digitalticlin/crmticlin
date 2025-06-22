
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
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
import InstanceSyncTest from './pages/InstanceSyncTest';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <AuthProvider>
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
              
              {/* Nova rota para teste de sincronização */}
              <Route 
                path="/instance-sync-test" 
                element={
                  <ProtectedRoute>
                    <InstanceSyncTest />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
