import { useEffect, useRef, useCallback } from 'react';

interface IntervalInfo {
  id: string;
  intervalId: number;
  createdAt: number;
  lastActivity: number;
  description: string;
  isActive: boolean;
}

/**
 * Hook para gerenciar e limpar intervalos órfãos
 * Evita acúmulo de intervalos desnecessários que sobrecarregam o sistema
 */
export const useIntervalCleanup = () => {
  const intervalsMapRef = useRef<Map<string, IntervalInfo>>(new Map());
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // Registrar um novo interval
  const registerInterval = useCallback((
    id: string, 
    intervalId: number, 
    description: string = 'Unknown interval'
  ) => {
    const info: IntervalInfo = {
      id,
      intervalId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      description,
      isActive: true
    };

    intervalsMapRef.current.set(id, info);
    console.log(`[Interval Cleanup] ➕ Registrado: ${id} (${description})`);
  }, []);

  // Marcar atividade de um interval
  const markActivity = useCallback((id: string) => {
    const info = intervalsMapRef.current.get(id);
    if (info) {
      info.lastActivity = Date.now();
      intervalsMapRef.current.set(id, info);
    }
  }, []);

  // Desregistrar interval
  const unregisterInterval = useCallback((id: string) => {
    const info = intervalsMapRef.current.get(id);
    if (info) {
      try {
        clearInterval(info.intervalId);
        console.log(`[Interval Cleanup] ➖ Limpo: ${id} (${info.description})`);
      } catch (error) {
        console.warn(`[Interval Cleanup] ⚠️ Erro ao limpar ${id}:`, error);
      }
      intervalsMapRef.current.delete(id);
    }
  }, []);

  // Detectar intervalos órfãos (sem atividade por muito tempo)
  const detectOrphanIntervals = useCallback(() => {
    const now = Date.now();
    const ORPHAN_THRESHOLD = 10 * 60 * 1000; // 10 minutos sem atividade
    const orphans: string[] = [];

    intervalsMapRef.current.forEach((info, id) => {
      const timeSinceActivity = now - info.lastActivity;
      
      if (timeSinceActivity > ORPHAN_THRESHOLD) {
        orphans.push(id);
        console.warn(`[Interval Cleanup] 🚨 Órfão detectado: ${id} (${info.description}) - ${Math.round(timeSinceActivity/1000/60)}min inativo`);
      }
    });

    return orphans;
  }, []);

  // Limpar intervalos órfãos
  const cleanupOrphans = useCallback(() => {
    const orphans = detectOrphanIntervals();
    
    if (orphans.length === 0) {
      console.log('[Interval Cleanup] ✅ Nenhum órfão detectado');
      return 0;
    }

    console.log(`[Interval Cleanup] 🧹 Limpando ${orphans.length} intervalos órfãos...`);
    
    orphans.forEach(id => {
      unregisterInterval(id);
    });

    return orphans.length;
  }, [detectOrphanIntervals, unregisterInterval]);

  // Relatório de intervalos ativos
  const getActiveIntervalsReport = useCallback(() => {
    const report = Array.from(intervalsMapRef.current.values()).map(info => ({
      id: info.id,
      description: info.description,
      ageMinutes: Math.round((Date.now() - info.createdAt) / 1000 / 60),
      inactiveMinutes: Math.round((Date.now() - info.lastActivity) / 1000 / 60),
      isActive: info.isActive
    }));

    return {
      total: report.length,
      intervals: report
    };
  }, []);

  // Forçar limpeza de todos os intervalos
  const forceCleanupAll = useCallback(() => {
    const total = intervalsMapRef.current.size;
    
    console.log(`[Interval Cleanup] 🚨 FORÇA: Limpando todos os ${total} intervalos`);
    
    intervalsMapRef.current.forEach((info, id) => {
      try {
        clearInterval(info.intervalId);
      } catch (error) {
        console.warn(`[Interval Cleanup] ⚠️ Erro ao limpar ${id}:`, error);
      }
    });

    intervalsMapRef.current.clear();
    return total;
  }, []);

  // Cleanup automático a cada 5 minutos
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      const cleaned = cleanupOrphans();
      const report = getActiveIntervalsReport();
      
      console.log(`[Interval Cleanup] 📊 Status:`, {
        active: report.total,
        cleaned,
        timestamp: new Date().toISOString()
      });
      
      // Se muitos intervalos órfãos, fazer limpeza mais agressiva
      if (report.total > 10) {
        console.warn(`[Interval Cleanup] ⚠️ Muitos intervalos ativos (${report.total}), considerando limpeza`);
      }
      
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
      forceCleanupAll();
    };
  }, [cleanupOrphans, getActiveIntervalsReport, forceCleanupAll]);

  // Wrapper para setInterval que se auto-registra
  const createManagedInterval = useCallback((
    callback: () => void,
    interval: number,
    id: string,
    description: string = 'Managed interval'
  ): (() => void) => {
    const intervalId = setInterval(() => {
      try {
        callback();
        markActivity(id);
      } catch (error) {
        console.error(`[Interval Cleanup] ❌ Erro em ${id}:`, error);
      }
    }, interval);

    registerInterval(id, intervalId as unknown as number, description);

    // Retornar função de cleanup
    return () => unregisterInterval(id);
  }, [registerInterval, markActivity, unregisterInterval]);

  return {
    registerInterval,
    unregisterInterval,
    markActivity,
    cleanupOrphans,
    getActiveIntervalsReport,
    forceCleanupAll,
    createManagedInterval
  };
}; 