import { useEffect, useRef } from "react";
import { MassSelectionReturn } from "@/hooks/useMassSelection";

interface PerformanceMonitorProps {
  massSelection: MassSelectionReturn;
  totalLeads: number;
  enabled?: boolean;
}

/**
 * 🚀 MONITOR DE PERFORMANCE PARA PRODUÇÃO
 * - Tracking de memory usage
 * - FPS monitoring durante seleções em massa
 * - Alertas automáticos para performance degradation
 * - Logs estruturados para debugging em produção
 */
export const PerformanceMonitor = ({ 
  massSelection, 
  totalLeads, 
  enabled = false // Desabilitado por padrão em produção
}: PerformanceMonitorProps) => {
  const { selectedCount, isSelectionMode } = massSelection;
  
  const lastUpdate = useRef(Date.now());
  const renderCount = useRef(0);
  const fpsHistory = useRef<number[]>([]);
  const memoryHistory = useRef<number[]>([]);
  
  useEffect(() => {
    if (!enabled) return;
    
    renderCount.current++;
    const now = Date.now();
    const deltaTime = now - lastUpdate.current;
    
    // FPS tracking
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      fpsHistory.current.push(fps);
      
      // Manter histórico dos últimos 60 frames
      if (fpsHistory.current.length > 60) {
        fpsHistory.current.shift();
      }
      
      // Alertar se FPS cair abaixo de 30
      if (fps < 30 && isSelectionMode) {
        console.warn(`[MassSelection] Performance degradation detected: ${fps.toFixed(1)} FPS`);
      }
    }
    
    // Memory tracking (se disponível)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      memoryHistory.current.push(memoryUsage);
      
      if (memoryHistory.current.length > 100) {
        memoryHistory.current.shift();
      }
      
      // Alertar se memory usage crescer muito rapidamente
      if (memoryHistory.current.length > 10) {
        const recent = memoryHistory.current.slice(-10);
        const growth = recent[recent.length - 1] - recent[0];
        if (growth > 50) { // 50MB de crescimento em 10 updates
          console.warn(`[MassSelection] Memory growth detected: +${growth.toFixed(1)}MB`);
        }
      }
    }
    
    lastUpdate.current = now;
  }, [selectedCount, isSelectionMode, enabled]);
  
  // Log stats a cada 5 segundos quando em selection mode
  useEffect(() => {
    if (!enabled || !isSelectionMode) return;
    
    const interval = setInterval(() => {
      const avgFPS = fpsHistory.current.length > 0 ? 
        fpsHistory.current.reduce((sum, fps) => sum + fps, 0) / fpsHistory.current.length : 0;
      
      const currentMemory = memoryHistory.current.length > 0 ? 
        memoryHistory.current[memoryHistory.current.length - 1] : 0;
      
      console.log(`[MassSelection Stats] Selected: ${selectedCount}/${totalLeads} | Avg FPS: ${avgFPS.toFixed(1)} | Memory: ${currentMemory.toFixed(1)}MB | Renders: ${renderCount.current}`);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [enabled, isSelectionMode, selectedCount, totalLeads]);
  
  return null; // Componente invisible
};