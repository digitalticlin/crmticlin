
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthHealthMetrics {
  redirectCount: number;
  lastRedirect: string;
  authStateChanges: number;
  errors: string[];
}

export const useAuthMonitoring = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const metricsRef = useRef<AuthHealthMetrics>({
    redirectCount: 0,
    lastRedirect: '',
    authStateChanges: 0,
    errors: []
  });

  const emergencyRecoveryRef = useRef<NodeJS.Timeout | null>(null);

  // Monitorar mudanças de estado de autenticação
  useEffect(() => {
    metricsRef.current.authStateChanges++;
    console.log(`[AuthMonitoring] Auth state change #${metricsRef.current.authStateChanges}`, {
      hasUser: !!user,
      loading,
      path: location.pathname
    });

    // Detectar possível loop baseado em muitas mudanças de estado
    if (metricsRef.current.authStateChanges > 10) {
      console.warn('[AuthMonitoring] Too many auth state changes detected');
      metricsRef.current.errors.push('Too many auth state changes');
      
      // Trigger emergency recovery após 2 segundos
      if (emergencyRecoveryRef.current) {
        clearTimeout(emergencyRecoveryRef.current);
      }
      
      emergencyRecoveryRef.current = setTimeout(() => {
        console.log('[AuthMonitoring] Triggering emergency recovery');
        triggerEmergencyRecovery();
      }, 2000);
    }

    // Reset metrics após períodos de estabilidade
    const resetTimer = setTimeout(() => {
      if (metricsRef.current.authStateChanges > 0) {
        console.log('[AuthMonitoring] Resetting metrics after stability period');
        metricsRef.current = {
          redirectCount: 0,
          lastRedirect: '',
          authStateChanges: 0,
          errors: []
        };
      }
    }, 30000); // Reset após 30 segundos de estabilidade

    return () => {
      clearTimeout(resetTimer);
    };
  }, [user, loading]);

  // Monitorar redirecionamentos
  useEffect(() => {
    if (metricsRef.current.lastRedirect !== location.pathname) {
      metricsRef.current.redirectCount++;
      metricsRef.current.lastRedirect = location.pathname;
      
      console.log(`[AuthMonitoring] Navigation to ${location.pathname} (count: ${metricsRef.current.redirectCount})`);
      
      // Detectar possível loop de redirecionamento
      if (metricsRef.current.redirectCount > 5) {
        console.error('[AuthMonitoring] Possible redirect loop detected');
        metricsRef.current.errors.push('Redirect loop detected');
      }
    }
  }, [location.pathname]);

  // Função de recovery de emergência
  const triggerEmergencyRecovery = () => {
    console.log('[AuthMonitoring] Starting emergency recovery procedure');
    
    try {
      // Limpar localStorage relacionado à auth
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('auth')
      );
      
      authKeys.forEach(key => {
        console.log(`[AuthMonitoring] Clearing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });

      // Navegar para página segura
      console.log('[AuthMonitoring] Navigating to safe page');
      window.location.href = '/';
      
    } catch (error) {
      console.error('[AuthMonitoring] Emergency recovery failed:', error);
      // Último recurso: reload completo
      window.location.reload();
    }
  };

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (emergencyRecoveryRef.current) {
        clearTimeout(emergencyRecoveryRef.current);
      }
    };
  }, []);

  return {
    metrics: metricsRef.current,
    triggerEmergencyRecovery
  };
};
