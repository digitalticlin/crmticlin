import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveCreation {
  instanceId: string;
  instanceName: string;
  startTime: number;
  status: 'creating' | 'connected';
}

export interface SmartPollingState {
  activeCreations: ActiveCreation[];
  totalActivePolls: number;
  isAnyPollingActive: boolean;
}

/**
 * 🚀 CORREÇÃO CRÍTICA: Sistema inteligente que só ativa polling quando há criações ativas
 * Zero polling quando todas instâncias estão conectadas ou usuário apenas navegando
 */
export const useSmartPollingManager = (userId?: string) => {
  const [state, setState] = useState<SmartPollingState>({
    activeCreations: [],
    totalActivePolls: 0,
    isAnyPollingActive: false
  });

  const monitoringIntervalRef = useRef<NodeJS.Timeout>();
  const lastCheckRef = useRef<number>(0);

  // 🚀 CORREÇÃO: Verificar instâncias em processo de criação (mais restritivo)
  const checkActiveCreations = useCallback(async (): Promise<ActiveCreation[]> => {
    if (!userId) return [];

    try {
      // 🚀 CORREÇÃO: Buscar apenas instâncias realmente sendo criadas (não conectadas)
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, connection_status, web_status, created_at')
        .eq('created_by_user_id', userId)
        .in('connection_status', ['creating', 'connecting', 'pending', 'initializing', 'qr_generated'])
        .neq('connection_status', 'connected') // 🚀 CRÍTICO: Excluir conectadas
        .neq('connection_status', 'ready'); // 🚀 CRÍTICO: Excluir prontas

      if (!instances || instances.length === 0) {
        return [];
      }

      // 🚀 CORREÇÃO: Filtrar apenas instâncias criadas nos últimos 5 minutos (muito mais restritivo)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      const activeCreations: ActiveCreation[] = instances
        .filter(instance => {
          const createdAt = new Date(instance.created_at).getTime();
          const isRecent = createdAt > fiveMinutesAgo;
          
          // 🚀 LOG DETALHADO para debug
          console.log('[Smart Polling] 🔍 Verificando instância:', {
            id: instance.id,
            name: instance.instance_name,
            status: instance.connection_status,
            createdAt: new Date(instance.created_at).toLocaleString(),
            isRecent,
            isBeingCreated: !['connected', 'ready'].includes(instance.connection_status)
          });
          
          return isRecent;
        })
        .map(instance => ({
          instanceId: instance.id,
          instanceName: instance.instance_name,
          startTime: new Date(instance.created_at).getTime(),
          status: instance.connection_status === 'connected' ? 'connected' : 'creating'
        }));

      console.log(`[Smart Polling] 📊 Criações ativas encontradas: ${activeCreations.length}`, {
        activeCreations: activeCreations.map(c => ({
          name: c.instanceName,
          status: c.status,
          age: Math.round((Date.now() - c.startTime) / 1000) + 's'
        }))
      });
      
      return activeCreations;

    } catch (error) {
      console.error('[Smart Polling] ❌ Erro ao verificar criações:', error);
      return [];
    }
  }, [userId]);

  // Atualizar estado das criações
  const updatePollingState = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    
    // 🚀 OTIMIZAÇÃO: Throttling para evitar chamadas excessivas
    if (now - lastCheckRef.current < 10000) { // 10 segundos mínimo entre verificações
      return;
    }
    
    lastCheckRef.current = now;

    try {
      const activeCreations = await checkActiveCreations();
      
      setState(prev => {
        const hasChanges = JSON.stringify(prev.activeCreations) !== JSON.stringify(activeCreations);
        
        if (hasChanges) {
          console.log('[Smart Polling] 🔄 Estado das criações mudou:', {
            anterior: prev.activeCreations.length,
            atual: activeCreations.length,
            isAnyPollingActive: activeCreations.length > 0
          });
        }
        
        return {
          activeCreations,
          totalActivePolls: activeCreations.length,
          isAnyPollingActive: activeCreations.length > 0
        };
      });
    } catch (error) {
      console.error('[Smart Polling] ❌ Erro ao atualizar estado:', error);
    }
  }, [userId, checkActiveCreations]);

  // Registrar nova criação
  const registerCreation = useCallback((instanceId: string, instanceName: string) => {
    console.log(`[Smart Polling] 📝 Registrando nova criação: ${instanceName}`);
    
    const newCreation: ActiveCreation = {
      instanceId,
      instanceName,
      startTime: Date.now(),
      status: 'creating'
    };

    setState(prev => {
      const filteredCreations = prev.activeCreations.filter(c => c.instanceId !== instanceId);
      const newCreations = [...filteredCreations, newCreation];
      
      return {
        activeCreations: newCreations,
        totalActivePolls: newCreations.length,
        isAnyPollingActive: newCreations.length > 0
      };
    });
  }, []);

  // Marcar criação como conectada (para polling)
  const markAsConnected = useCallback((instanceId: string) => {
    console.log(`[Smart Polling] ✅ Marcando como conectada: ${instanceId}`);
    
    setState(prev => {
      const newCreations = prev.activeCreations.filter(c => c.instanceId !== instanceId);
      
      return {
        ...prev,
        activeCreations: newCreations,
        totalActivePolls: newCreations.length,
        isAnyPollingActive: newCreations.length > 0
      };
    });
  }, []);

  // Limpar criações antigas (timeout)
  const cleanupOldCreations = useCallback(() => {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000); // 🚀 CORREÇÃO: 10 minutos para timeout
    
    setState(prev => {
      const newCreations = prev.activeCreations.filter(c => c.startTime > tenMinutesAgo);
      
      if (newCreations.length !== prev.activeCreations.length) {
        console.log(`[Smart Polling] 🧹 Limpando ${prev.activeCreations.length - newCreations.length} criações antigas`);
      }

      return {
        ...prev,
        activeCreations: newCreations,
        totalActivePolls: newCreations.length,
        isAnyPollingActive: newCreations.length > 0
      };
    });
  }, []);

  // 🚀 CORREÇÃO CRÍTICA: Verificar se deve ativar polling (mais restritivo)
  const shouldActivatePolling = useCallback((type: 'qr' | 'status' | 'general') => {
    switch (type) {
      case 'qr':
      case 'status':
        // 🚀 CRÍTICO: Polling de QR e status APENAS durante criações ativas
        const shouldActivate = state.isAnyPollingActive && state.activeCreations.length > 0;
        
        if (!shouldActivate) {
          console.log('[Smart Polling] 💤 Polling QR DESATIVADO - nenhuma criação ativa:', {
            isAnyPollingActive: state.isAnyPollingActive,
            activeCreationsCount: state.activeCreations.length
          });
        }
        
        return shouldActivate;
      
      case 'general':
        // Polling geral sempre ativo, mas com intervalo longo quando não há criações
        return true;
      
      default:
        return false;
    }
  }, [state.isAnyPollingActive, state.activeCreations.length]);

  // Obter intervalo otimizado baseado em atividade
  const getOptimizedInterval = useCallback((type: 'qr' | 'status' | 'general') => {
    switch (type) {
      case 'qr':
        return state.isAnyPollingActive ? 5000 : 0; // 5s durante criação, 0 quando inativo
      
      case 'status':
        return state.isAnyPollingActive ? 10000 : 0; // 10s durante criação, 0 quando inativo
      
      case 'general':
        return state.isAnyPollingActive ? 60000 : 300000; // 1min ativo, 5min inativo
      
      default:
        return 0;
    }
  }, [state.isAnyPollingActive]);

  // 🚀 CORREÇÃO: Monitor automático menos agressivo
  useEffect(() => {
    if (!userId) return;

    // Verificação inicial
    updatePollingState();

    // 🚀 CORREÇÃO: Monitor periódico menos frequente
    monitoringIntervalRef.current = setInterval(() => {
      updatePollingState();
      cleanupOldCreations();
    }, 60000); // 🚀 CORREÇÃO: 60s em vez de 30s

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, [userId, updatePollingState, cleanupOldCreations]);

  return {
    ...state,
    registerCreation,
    markAsConnected,
    shouldActivatePolling,
    getOptimizedInterval,
    updatePollingState,
    cleanupOldCreations
  };
}; 