
import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { BigQueryOptimizer } from './utils/immediate-bigquery-fix';
import { supabase } from './integrations/supabase/client'; // 🚀 IMPORTAR SUPABASE
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AdminGuard } from './components/auth/AdminGuard';
import { PortalErrorBoundary } from './components/error/PortalErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import './styles/safari-fixes.css'; // Safari/WebKit fixes para transparências
import { applySafariFixesIfNeeded } from './utils/safari-detector'; // Auto-detect Safari

// Lazy loading para todas as páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Index'));
const Register = lazy(() => import('./pages/Register'));
const FunnelsPage = lazy(() => import('./pages/SalesFunnel'));
const LeadsPage = lazy(() => import('./pages/Clients'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const WhatsAppWebPage = lazy(() => import('./pages/WhatsAppChat'));
const AutomationPage = lazy(() => import('./pages/Automation'));
const AIAgentsPage = lazy(() => import('./pages/AIAgents'));
const PlansPage = lazy(() => import('./pages/Plans'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AcceptInvite = lazy(() => import('./components/invite/AcceptInvite').then(m => ({ default: m.AcceptInvite })));
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'));
const ConfirmEmailInstructions = lazy(() => import('./pages/ConfirmEmailInstructions'));

// 🚀 DECLARAÇÃO GLOBAL PARA TYPESCRIPT
declare global {
  interface Window {
    supabase: typeof supabase;
  }
}

const queryClient = new QueryClient();

// Componente de Loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-yellow-500"></div>
  </div>
);

// ✅ COMPONENTE DE ROTAS SPA - SIDEBAR FIXO
function AppLayoutRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Navigate to="/dashboard" replace />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/funnels" 
        element={
          <AppLayout fullHeight>
            <Suspense fallback={<PageLoader />}>
              <FunnelsPage />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/sales-funnel" 
        element={
          <AppLayout fullHeight>
            <Suspense fallback={<PageLoader />}>
              <FunnelsPage />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/whatsapp-chat" 
        element={
          <AppLayout fullHeight>
            <Suspense fallback={<PageLoader />}>
              <WhatsAppWebPage />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/clients" 
        element={
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <LeadsPage />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/leads" 
        element={
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <LeadsPage />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/automation" 
        element={
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <AutomationPage />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/ai-agents" 
        element={
          <AdminGuard>
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <AIAgentsPage />
              </Suspense>
            </AppLayout>
          </AdminGuard>
        } 
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <PlansPage />
              </Suspense>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Checkout />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route 
        path="/settings" 
        element={
          <AdminGuard>
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            </AppLayout>
          </AdminGuard>
        } 
      />
      <Route 
        path="/whatsapp-web" 
        element={
          <AppLayout fullHeight>
            <Suspense fallback={<PageLoader />}>
              <WhatsAppWebPage />
            </Suspense>
          </AppLayout>
        } 
      />
    </Routes>
  );
}

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

      // Aplicar fixes do Safari se necessário
      applySafariFixesIfNeeded();
      console.log('[App] ✅ Safari fixes aplicados se necessário');
      
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
          <AuthProvider>
            <RoleProvider>
              <SidebarProvider>
                <Routes>
                  {/* Rotas públicas - fora do layout */}
                  <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
                  <Route path="/register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
                  <Route path="/invite/:token" element={<Suspense fallback={<PageLoader />}><AcceptInvite /></Suspense>} />
                  <Route path="/confirm-email" element={<Suspense fallback={<PageLoader />}><ConfirmEmailInstructions /></Suspense>} />
                  <Route path="/confirm/:token" element={<Suspense fallback={<PageLoader />}><ConfirmEmail /></Suspense>} />
                  
                  {/* Rotas protegidas - dentro do layout SPA */}
                  <Route 
                    path="/*" 
                    element={
                      <ProtectedRoute>
                        <AppLayoutRoutes />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </SidebarProvider>
            </RoleProvider>
          </AuthProvider>
        </Router>
      </PortalErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
