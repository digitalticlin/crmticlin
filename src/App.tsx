import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import WhatsAppIntegration from './pages/WhatsAppIntegration';
import FunnelsPage from './pages/FunnelsPage';
import LeadsPage from './pages/LeadsPage';
import SettingsPage from './pages/SettingsPage';
import WhatsAppWebPage from './pages/WhatsAppWebPage';
import InstanceSyncTest from './pages/InstanceSyncTest';

function App() {
  return (
    <Router>
      <QueryClient>
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
      </QueryClient>
    </Router>
  );
}

export default App;
