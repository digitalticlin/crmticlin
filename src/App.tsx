
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { QRCodeModalProvider } from './modules/whatsapp/instanceCreation/hooks/useQRCodeModal';
import { BigQueryOptimizer } from './utils/immediate-bigquery-fix';
import { supabase } from './integrations/supabase/client'; // 🚀 IMPORTAR SUPABASE
import './utils/debug-messages-test'; // 🔧 IMPORTAR SCRIPTS DE DEBUG
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PortalErrorBoundary } from './components/error/PortalErrorBoundary';
import Dashboard from './pages/Dashboard';
import Login from './pages/Index';
import Register from './pages/Register';
import WhatsAppIntegration from './pages/Integration';
import FunnelsPage from './pages/SalesFunnel';
import LeadsPage from './pages/Clients';
import SettingsPage from './pages/Settings';
import WhatsAppWebPage from './pages/WhatsAppChat';
import AutomationPage from './pages/Automation';
import AIAgentsPage from './pages/AIAgents';
import PlansPage from './pages/Plans';
import MediaDebug from './pages/MediaDebug';

// 🚀 DECLARAÇÃO GLOBAL PARA TYPESCRIPT
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}

const queryClient = new QueryClient();

function App() {
  console.log('[App] 🚀 Inicializando aplicação');
  
  // 🚀 ADICIONADO: Monitor de mudanças de rota para debug
  useEffect(() => {
    const logRoute = () => {
      console.log('[App] 📍 Rota atual:', window.location.pathname);
    };
    
    // Log inicial
    logRoute();
    
    // Listener para mudanças de rota via popstate (navegação)
    window.addEventListener('popstate', logRoute);
    
    return () => {
      window.removeEventListener('popstate', logRoute);
    };
  }, []);
  
  // 🚀 CORREÇÃO CRÍTICA: Expor Supabase globalmente para debug
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.supabase = supabase;
      console.log('[App] ✅ Supabase exposto globalmente para debug');
      
             // 🚀 FUNÇÃO DE DEBUG GLOBAL MELHORADA
       (window as any).debugAuth = async () => {
         const { data: { session }, error } = await supabase.auth.getSession();
         console.log('[DEBUG] 🔍 Estado completo da autenticação:', {
           hasSession: !!session,
           userId: session?.user?.id,
           userEmail: session?.user?.email,
           currentPath: window.location.pathname,
           error: error?.message,
           timestamp: new Date().toISOString(),
           sessionData: session,
           accessToken: session?.access_token ? 'EXISTS' : 'MISSING',
           refreshToken: session?.refresh_token ? 'EXISTS' : 'MISSING'
         });
         return session;
       };

       // 🚀 FUNÇÃO PARA FORÇAR REFRESH DA SESSÃO
       (window as any).refreshAuth = async () => {
         console.log('[DEBUG] 🔄 Forçando refresh da sessão...');
         const { data, error } = await supabase.auth.refreshSession();
         console.log('[DEBUG] Resultado do refresh:', { data, error });
         return data;
       };
      
      // Teste único de autenticação (evitar loops)
      if (!window.authTestExecuted) {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          console.log('[App] 🔐 Estado inicial de autenticação:', {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            currentPath: window.location.pathname,
            error: error?.message
          });
        });
        window.authTestExecuted = true;
      }
    }
  }, []);
  
  // OTIMIZAÇÃO: Sistema inteligente de BigQuery (não executa automaticamente)
  useEffect(() => {
    console.log('[App] ✅ BigQuery Optimizer carregado - ativará apenas se necessário');
    
    // Listener global para erros BigQuery
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('quota') || event.error?.message?.includes('exceeded')) {
        console.log('[App] 🚨 Erro BigQuery detectado - ativando modo economia');
        BigQueryOptimizer.handleError(event.error);
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <PortalErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <AuthProvider>
              <SidebarProvider>
                <QRCodeModalProvider>
                <Routes>
                  {/* Rotas públicas */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Rotas protegidas */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
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
                    path="/sales-funnel" 
                    element={
                      <ProtectedRoute>
                        <FunnelsPage />
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
                    path="/clients" 
                    element={
                      <ProtectedRoute>
                        <LeadsPage />
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
                    path="/automation" 
                    element={
                      <ProtectedRoute>
                        <AutomationPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/integration" 
                    element={
                      <ProtectedRoute>
                        <WhatsAppIntegration />
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
                    path="/ai-agents" 
                    element={
                      <ProtectedRoute>
                        <AIAgentsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/plans" 
                    element={
                      <ProtectedRoute>
                        <PlansPage />
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
                    path="/debug/media" 
                    element={
                      <ProtectedRoute>
                        <MediaDebug />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </QRCodeModalProvider>
            </SidebarProvider>
          </AuthProvider>
        </div>
      </Router>
      </PortalErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
