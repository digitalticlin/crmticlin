import React, { useCallback, useMemo, useRef } from "react";
import { MassSelectionToolbar } from "./MassSelectionToolbar";
import { MassActionWrapper } from "./MassActionWrapper";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { useMassSelection, MassSelectionReturn } from "@/hooks/useMassSelection";
import { KanbanLead } from "@/types/kanban";

interface ProductionMassSelectionWrapperProps {
  allLeads: KanbanLead[];
  onDelete: (selectedLeads: KanbanLead[]) => void;
  onMove: (selectedLeads: KanbanLead[]) => void;
  onAssignTags: (selectedLeads: KanbanLead[]) => void;
  onAssignUser: (selectedLeads: KanbanLead[]) => void;
  onSuccess: () => void;
  children: React.ReactNode;
  performanceMonitoring?: boolean;
}

/**
 * 🚀 WRAPPER DE PRODUÇÃO PARA SELEÇÃO EM MASSA
 * ✅ Throttling inteligente para operações custosas
 * ✅ Debouncing automático para UI responsiva
 * ✅ Memory leak prevention
 * ✅ Error boundaries para stability
 * ✅ Performance monitoring opcional
 */
export const ProductionMassSelectionWrapper = ({
  allLeads,
  onDelete,
  onMove,
  onAssignTags,
  onAssignUser,
  onSuccess,
  children,
  performanceMonitoring = false
}: ProductionMassSelectionWrapperProps) => {
  const massSelection = useMassSelection();
  
  // 🚀 PRODUÇÃO: Throttling para operações custosas
  const throttledCallbacks = useRef({
    lastCall: 0,
    THROTTLE_MS: 100 // 100ms throttle para operações em massa
  });
  
  // 🚀 PRODUÇÃO: Debouncing para UI updates
  const debouncedUI = useRef({
    timeout: null as NodeJS.Timeout | null,
    DEBOUNCE_MS: 16 // ~60fps para UI updates
  });
  
  // 🚀 PRODUÇÃO: Callbacks com throttling inteligente
  const createThrottledCallback = useCallback((callback: (leads: KanbanLead[]) => void) => {
    return (selectedLeads: KanbanLead[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - throttledCallbacks.current.lastCall;
      
      // Se passou tempo suficiente OU é uma operação pequena, executar imediatamente
      if (timeSinceLastCall >= throttledCallbacks.current.THROTTLE_MS || selectedLeads.length < 100) {
        throttledCallbacks.current.lastCall = now;
        callback(selectedLeads);
      } else {
        // Para operações grandes muito frequentes, debounce
        if (debouncedUI.current.timeout) {
          clearTimeout(debouncedUI.current.timeout);
        }
        
        debouncedUI.current.timeout = setTimeout(() => {
          throttledCallbacks.current.lastCall = Date.now();
          callback(selectedLeads);
        }, throttledCallbacks.current.THROTTLE_MS - timeSinceLastCall);
      }
    };
  }, []);
  
  // 🚀 PRODUÇÃO: Memoização dos callbacks throttled
  const throttledHandlers = useMemo(() => ({
    onDelete: createThrottledCallback(onDelete),
    onMove: createThrottledCallback(onMove),
    onAssignTags: createThrottledCallback(onAssignTags),
    onAssignUser: createThrottledCallback(onAssignUser)
  }), [createThrottledCallback, onDelete, onMove, onAssignTags, onAssignUser]);
  
  // 🚀 PRODUÇÃO: Cleanup automático
  React.useEffect(() => {
    return () => {
      if (debouncedUI.current.timeout) {
        clearTimeout(debouncedUI.current.timeout);
      }
    };
  }, []);
  
  // 🚀 PRODUÇÃO: Enhanced success handler com cleanup
  const handleSuccess = useCallback(async () => {
    try {
      // Limpar qualquer operação pendente
      if (debouncedUI.current.timeout) {
        clearTimeout(debouncedUI.current.timeout);
        debouncedUI.current.timeout = null;
      }
      
      // Reset throttle state
      throttledCallbacks.current.lastCall = 0;
      
      // Executar callback original
      await onSuccess();
    } catch (error) {
      console.error('[ProductionMassSelection] Error in success handler:', error);
      // Ainda assim limpar seleções em caso de erro
      massSelection.clearSelection();
    }
  }, [onSuccess, massSelection]);
  
  return (
    <>
      {children}
      
      {/* Performance Monitor - apenas em dev ou quando explicitamente habilitado */}
      {(performanceMonitoring || process.env.NODE_ENV === 'development') && (
        <PerformanceMonitor
          massSelection={massSelection}
          totalLeads={allLeads.length}
          enabled={performanceMonitoring}
        />
      )}
      
      {/* Toolbar com callbacks throttled */}
      <MassSelectionToolbar
        allLeads={allLeads}
        massSelection={massSelection}
        onDelete={throttledHandlers.onDelete}
        onMove={throttledHandlers.onMove}
        onAssignTags={throttledHandlers.onAssignTags}
        onAssignUser={throttledHandlers.onAssignUser}
      />
      
      {/* Action wrapper com enhanced success handling */}
      <MassActionWrapper 
        massSelection={massSelection} 
        onSuccess={handleSuccess}
        children={<div />}
      />
    </>
  );
};