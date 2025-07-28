
/**
 * ✅ COMPONENTE DE MONITORAMENTO DE PERFORMANCE
 * Apenas ativo em desenvolvimento para detectar problemas
 */

import React, { useEffect, useState } from 'react';
import { eventManager } from '@/utils/eventManager';
import { performanceLogger } from '@/utils/logger';

interface PerformanceStats {
  eventListeners: number;
  renderCount: number;
  lastUpdate: string;
  memoryUsage?: number;
}

const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    eventListeners: 0,
    renderCount: 0,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Só ativar em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let renderCount = 0;
    
    const updateStats = () => {
      const eventStats = eventManager.getStats();
      
      // Obter uso de memória se disponível
      let memoryUsage;
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        memoryUsage = Math.round(memInfo.usedJSHeapSize / 1024 / 1024); // MB
      }

      setStats({
        eventListeners: eventStats.totalSubscriptions,
        renderCount: ++renderCount,
        lastUpdate: new Date().toLocaleTimeString(),
        memoryUsage
      });

      // Log se há problemas de performance
      if (eventStats.totalSubscriptions > 50) {
        console.warn('🚨 Muitos event listeners ativos:', eventStats.totalSubscriptions);
      }
    };

    // Atualizar stats a cada 2 segundos
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Primeira execução

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Não renderizar em produção
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Botão para toggle */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full text-xs hover:bg-gray-700 transition-colors"
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Monitor */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-50 bg-black/90 text-white p-4 rounded-lg text-xs max-w-xs">
          <div className="font-bold mb-2">Performance Monitor</div>
          
          <div className="space-y-1">
            <div>Event Listeners: <span className="text-yellow-400">{stats.eventListeners}</span></div>
            <div>Renders: <span className="text-purple-400">{stats.renderCount}</span></div>
            {stats.memoryUsage && (
              <div>Memory: <span className="text-red-400">{stats.memoryUsage}MB</span></div>
            )}
            <div className="text-gray-400 text-[10px] mt-2">
              Última atualização: {stats.lastUpdate}
            </div>
          </div>

          {/* Alertas */}
          {stats.eventListeners > 50 && (
            <div className="mt-2 p-1 bg-yellow-500/20 border border-yellow-500 rounded text-[10px]">
              ⚠️ Muitos event listeners
            </div>
          )}

          {stats.memoryUsage && stats.memoryUsage > 100 && (
            <div className="mt-2 p-1 bg-orange-500/20 border border-orange-500 rounded text-[10px]">
              ⚠️ Alto uso de memória
            </div>
          )}

          {/* Botões de ação */}
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                eventManager.removeAllEventListeners();
                console.log('🧹 Event listeners limpos');
              }}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-[10px]"
            >
              Limpar Events
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceMonitor;
