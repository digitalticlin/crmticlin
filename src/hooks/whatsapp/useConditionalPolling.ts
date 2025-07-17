import { useRef, useCallback, useEffect } from 'react';

interface PollingConfig {
  id: string;
  interval: number;
  callback: () => Promise<void> | void;
  condition: () => boolean;
  isActive: boolean;
}

interface ConditionalPollingManager {
  registerPolling: (config: PollingConfig) => void;
  unregisterPolling: (id: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  checkActivity: () => void;
}

/**
 * Hook para gerenciar polling condicional
 * Só ativa monitoramentos quando há atividade real
 */
export const useConditionalPolling = (): ConditionalPollingManager => {
  const pollingConfigsRef = useRef<Map<string, PollingConfig>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();

  // Tempo de inatividade para pausar monitoramentos (5 minutos)
  const INACTIVITY_THRESHOLD = 5 * 60 * 1000;
  
  // Registrar atividade
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    console.log('[Conditional Polling] 🟢 Atividade detectada');
  }, []);

  // Verificar se há atividade recente
  const hasRecentActivity = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    return timeSinceLastActivity < INACTIVITY_THRESHOLD;
  }, []);

  // Iniciar polling para uma configuração específica
  const startPolling = useCallback((config: PollingConfig) => {
    if (intervalRefs.current.has(config.id)) {
      clearInterval(intervalRefs.current.get(config.id));
    }

    const interval = setInterval(async () => {
      // Verificar se ainda deve continuar
      if (!config.condition() || !hasRecentActivity()) {
        console.log(`[Conditional Polling] ⏸️ Pausando ${config.id} - sem atividade`);
        stopPolling(config.id);
        return;
      }

      try {
        await config.callback();
        registerActivity();
      } catch (error) {
        console.error(`[Conditional Polling] ❌ Erro em ${config.id}:`, error);
      }
    }, config.interval);

    intervalRefs.current.set(config.id, interval);
    console.log(`[Conditional Polling] ▶️ Iniciando ${config.id} (${config.interval}ms)`);
  }, [hasRecentActivity, registerActivity]);

  // Parar polling específico
  const stopPolling = useCallback((id: string) => {
    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
      console.log(`[Conditional Polling] ⏹️ Parado: ${id}`);
    }
  }, []);

  // Registrar novo polling
  const registerPolling = useCallback((config: PollingConfig) => {
    pollingConfigsRef.current.set(config.id, config);
    
    if (config.isActive && config.condition() && hasRecentActivity()) {
      startPolling(config);
    }
  }, [startPolling, hasRecentActivity]);

  // Desregistrar polling
  const unregisterPolling = useCallback((id: string) => {
    stopPolling(id);
    pollingConfigsRef.current.delete(id);
  }, [stopPolling]);

  // Pausar todos os pollings
  const pauseAll = useCallback(() => {
    console.log('[Conditional Polling] ⏸️ Pausando todos os pollings');
    intervalRefs.current.forEach((interval, id) => {
      clearInterval(interval);
      console.log(`[Conditional Polling] ⏸️ Pausado: ${id}`);
    });
    intervalRefs.current.clear();
  }, []);

  // Retomar pollings ativos
  const resumeAll = useCallback(() => {
    console.log('[Conditional Polling] ▶️ Retomando pollings ativos');
    pollingConfigsRef.current.forEach((config, id) => {
      if (config.isActive && config.condition()) {
        startPolling(config);
      }
    });
  }, [startPolling]);

  // Verificar atividade e gerenciar pollings
  const checkActivity = useCallback(() => {
    const hasActivity = hasRecentActivity();
    const activePollings = intervalRefs.current.size;

    console.log(`[Conditional Polling] 🔍 Check - Atividade: ${hasActivity}, Pollings ativos: ${activePollings}`);

    if (!hasActivity && activePollings > 0) {
      console.log('[Conditional Polling] 💤 Pausando por inatividade');
      pauseAll();
    } else if (hasActivity && activePollings === 0) {
      console.log('[Conditional Polling] 🔄 Retomando por atividade');
      resumeAll();
    }
  }, [hasRecentActivity, pauseAll, resumeAll]);

  // Monitor de inatividade
  useEffect(() => {
    const checkInactivity = () => {
      checkActivity();
      
      // Agendar próxima verificação
      inactivityTimeoutRef.current = setTimeout(checkInactivity, 60000); // 1 minuto
    };

    checkInactivity();

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      pauseAll();
    };
  }, [checkActivity, pauseAll]);

  // Detectar atividade do usuário
  useEffect(() => {
    const handleUserActivity = () => {
      registerActivity();
      
      // Se não há pollings ativos mas deveria haver, retomar
      if (intervalRefs.current.size === 0) {
        const activeConfigs = Array.from(pollingConfigsRef.current.values())
          .filter(config => config.isActive && config.condition());
        
        if (activeConfigs.length > 0) {
          console.log('[Conditional Polling] 🎯 Retomando por atividade do usuário');
          resumeAll();
        }
      }
    };

    // Eventos que indicam atividade do usuário
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [registerActivity, resumeAll]);

  return {
    registerPolling,
    unregisterPolling,
    pauseAll,
    resumeAll,
    checkActivity
  };
}; 