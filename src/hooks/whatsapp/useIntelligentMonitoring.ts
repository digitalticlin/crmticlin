import { useEffect, useRef, useCallback, useState } from 'react';
import { useConditionalPolling } from './useConditionalPolling';
import { supabase } from '@/integrations/supabase/client';

interface MonitoringState {
  isActiveCreation: boolean;
  hasRecentActivity: boolean;
  totalInstances: number;
  pendingOperations: number;
}

/**
 * Sistema de monitoramento inteligente
 * Só ativa pollings quando há atividade real ou processos pendentes
 */
export const useIntelligentMonitoring = (userId?: string) => {
  const [state, setState] = useState<MonitoringState>({
    isActiveCreation: false,
    hasRecentActivity: false,
    totalInstances: 0,
    pendingOperations: 0
  });

  const { registerPolling, unregisterPolling, checkActivity } = useConditionalPolling();
  const lastQRRequestRef = useRef<number>(0);
  const lastInstanceActionRef = useRef<number>(0);

  // Detectar se há operações de criação ativas
  const checkActiveCreations = useCallback(async () => {
    if (!userId) return false;

    try {
      // Verificar instâncias em estado de criação/conectando
      const { data: pendingInstances } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, web_status, created_at')
        .eq('created_by_user_id', userId)
        .in('connection_status', ['connecting', 'pending', 'initializing']);

      const hasPendingCreations = pendingInstances && pendingInstances.length > 0;
      
      // Verificar se há criações muito recentes (últimos 2 minutos)
      const recentCreations = pendingInstances?.filter(instance => {
        const createdAt = new Date(instance.created_at).getTime();
        const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
        return createdAt > twoMinutesAgo;
      }) || [];

      const hasRecentCreations = recentCreations.length > 0;

      console.log('[Intelligent Monitoring] 📊 Status:', {
        pendingInstances: pendingInstances?.length || 0,
        recentCreations: recentCreations.length,
        hasPendingCreations,
        hasRecentCreations
      });

      return hasPendingCreations || hasRecentCreations;
    } catch (error) {
      console.error('[Intelligent Monitoring] ❌ Erro ao verificar criações:', error);
      return false;
    }
  }, [userId]);

  // Detectar atividade de QR Code
  const detectQRActivity = useCallback(() => {
    const timeSinceLastQR = Date.now() - lastQRRequestRef.current;
    return timeSinceLastQR < (60 * 1000); // 1 minuto
  }, []);

  // Detectar atividade de instâncias
  const detectInstanceActivity = useCallback(() => {
    const timeSinceLastAction = Date.now() - lastInstanceActionRef.current;
    return timeSinceLastAction < (2 * 60 * 1000); // 2 minutos
  }, []);

  // Condição principal para ativar monitoramentos
  const shouldActivateMonitoring = useCallback(() => {
    return state.isActiveCreation || 
           state.hasRecentActivity || 
           state.pendingOperations > 0 ||
           detectQRActivity() ||
           detectInstanceActivity();
  }, [state, detectQRActivity, detectInstanceActivity]);

  // Registrar atividade de QR
  const registerQRActivity = useCallback(() => {
    lastQRRequestRef.current = Date.now();
    setState(prev => ({ ...prev, hasRecentActivity: true }));
    console.log('[Intelligent Monitoring] 📱 Atividade QR detectada');
  }, []);

  // Registrar atividade de instância
  const registerInstanceActivity = useCallback(() => {
    lastInstanceActionRef.current = Date.now();
    setState(prev => ({ ...prev, hasRecentActivity: true }));
    console.log('[Intelligent Monitoring] 🔧 Atividade de instância detectada');
  }, []);

  // Atualizar estado do monitoramento
  const updateMonitoringState = useCallback(async () => {
    if (!userId) return;

    const isActiveCreation = await checkActiveCreations();
    
    // Contar total de instâncias
    const { data: allInstances } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('created_by_user_id', userId);

    const totalInstances = allInstances?.length || 0;

    setState(prev => ({
      ...prev,
      isActiveCreation,
      totalInstances,
      pendingOperations: isActiveCreation ? 1 : 0
    }));

    // Resetar atividade após verificação
    setTimeout(() => {
      setState(prev => ({ ...prev, hasRecentActivity: false }));
    }, 5 * 60 * 1000); // 5 minutos

  }, [userId, checkActiveCreations]);

  // Configurar monitoramentos condicionais
  useEffect(() => {
    if (!userId) return;

    // Monitor de QR Code (só quando há criação ativa)
    registerPolling({
      id: 'qr-monitoring',
      interval: 15000, // 15 segundos
      callback: async () => {
        console.log('[Intelligent Monitoring] 🔍 Verificando QR codes...');
        // Lógica de verificação de QR será chamada apenas quando necessário
      },
      condition: () => state.isActiveCreation || detectQRActivity(),
      isActive: true
    });

    // Monitor de status de instâncias (só quando há instâncias pendentes)
    registerPolling({
      id: 'instance-status-monitoring',
      interval: 30000, // 30 segundos
      callback: async () => {
        console.log('[Intelligent Monitoring] 📊 Verificando status de instâncias...');
        await updateMonitoringState();
      },
      condition: () => shouldActivateMonitoring(),
      isActive: true
    });

    // Monitor de saúde geral (intervalo mais longo, sempre ativo)
    registerPolling({
      id: 'health-monitoring',
      interval: 300000, // 5 minutos
      callback: async () => {
        console.log('[Intelligent Monitoring] 💚 Verificação de saúde geral...');
        await updateMonitoringState();
        checkActivity();
      },
      condition: () => true, // Sempre ativo, mas intervalo longo
      isActive: true
    });

    return () => {
      unregisterPolling('qr-monitoring');
      unregisterPolling('instance-status-monitoring');
      unregisterPolling('health-monitoring');
    };
  }, [userId, registerPolling, unregisterPolling, state, shouldActivateMonitoring, detectQRActivity, updateMonitoringState, checkActivity]);

  // Verificação inicial
  useEffect(() => {
    if (userId) {
      updateMonitoringState();
    }
  }, [userId, updateMonitoringState]);

  return {
    state,
    registerQRActivity,
    registerInstanceActivity,
    shouldActivateMonitoring: shouldActivateMonitoring(),
    updateMonitoringState
  };
}; 