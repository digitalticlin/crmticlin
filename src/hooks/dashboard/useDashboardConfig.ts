
import React, { useCallback, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useDashboardState } from "./state/useDashboardState";
import { useConfigInitialization } from "./initialization/useConfigInitialization";
import { createConfigHandlers } from "./handlers/configHandlers";
import { configOperations } from "./operations/configOperations";

export { type DashboardConfig } from "./types/dashboardConfigTypes";

type UseDashboardConfigReturn = {
  config: any;
  loading: boolean;
  saving: boolean;
  forceUpdate: number;
  handleKPIToggle: ReturnType<typeof createConfigHandlers>['handleKPIToggle'];
  handleChartToggle: ReturnType<typeof createConfigHandlers>['handleChartToggle'];
  updateConfig: ReturnType<typeof createConfigHandlers>['updateConfig'];
  resetToDefault: ReturnType<typeof createConfigHandlers>['resetToDefault'];
  getCurrentState: ReturnType<typeof createConfigHandlers>['getCurrentState'];
};

const DashboardConfigContext = createContext<UseDashboardConfigReturn | null>(null);

function useDashboardConfigImpl(): UseDashboardConfigReturn {
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  
  const {
    config,
    setConfig,
    loading,
    setLoading,
    saving,
    setSaving,
    forceUpdate,
    triggerForceUpdate,
    saveTimeoutRef,
    isMountedRef,
    isInitializedRef
  } = useDashboardState();

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveTimeoutRef]);

  // Create save scheduler
  const scheduleSave = useCallback((configToSave: any) => {
    if (!isMountedRef.current || !user?.id) return;
    
    const saveScheduler = configOperations.createSaveScheduler(user.id, companyId, setSaving);
    saveScheduler(configToSave, saveTimeoutRef);
  }, [user?.id, companyId, setSaving, saveTimeoutRef, isMountedRef]);

  // Initialize config
  useConfigInitialization(
    user,
    companyId,
    setConfig,
    setLoading,
    triggerForceUpdate,
    isMountedRef,
    isInitializedRef
  );

  // Realtime sync entre sessões (evita interferir no otimista/UX local)
  const lastSaveAtRef = useRef<number>(0);
  useEffect(() => {
    if (!user?.id) return;
    let channel: any | null = null;

    try {
      channel = supabase.channel('dashboard-config-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'dashboard_configs',
          filter: `created_by_user_id=eq.${user.id}`
        }, (payload: any) => {
          const updatedAt = new Date(payload.new?.updated_at || payload.old?.updated_at || Date.now()).getTime();
          // Ignorar eventos gerados por este cliente nos últimos 2s (debounce anti-loop)
          if (updatedAt && (Date.now() - lastSaveAtRef.current) < 2000) return;

          const next = payload.new?.layout_config;
          if (!next) return;
          setConfig(next);
          triggerForceUpdate();
        })
        .subscribe();
    } catch (err) {
      console.warn('[DashboardConfig] Realtime subscribe falhou:', err);
    }

    return () => {
      try {
        channel?.unsubscribe();
      } catch {}
    };
  }, [user?.id, setConfig, triggerForceUpdate]);

  // Create handlers
  const handlers = createConfigHandlers(
    config,
    setConfig,
    triggerForceUpdate,
    scheduleSave,
    isInitializedRef
  );

  return {
    config,
    loading,
    saving,
    forceUpdate,
    ...handlers
  };
}

export function DashboardConfigProvider({ children }: { children: ReactNode }) {
  const value = useDashboardConfigImpl();
  return React.createElement(
    DashboardConfigContext.Provider,
    { value },
    children
  );
}

export const useDashboardConfig = () => {
  const ctx = useContext(DashboardConfigContext);
  // Fallback para manter compatibilidade caso Provider não esteja no topo
  return ctx ?? useDashboardConfigImpl();
};
