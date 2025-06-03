
import { useState, useEffect, useRef, useCallback } from "react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useDemoMode } from "@/hooks/dashboard/useDemoMode";
import { DashboardKPIsWithTrends, defaultKPIs } from "./types/dashboardTypes";
import { KPILoaderService } from "./services/kpiLoaderService";

// Re-export types for backward compatibility
export type {
  DashboardKPIs,
  KPITrend,
  DashboardKPIsWithTrends
} from "./types/dashboardTypes";

export const useDashboardKPIs = (periodDays: string) => {
  const [kpis, setKPIs] = useState<DashboardKPIsWithTrends>(defaultKPIs);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();
  const { isDemoMode, getDemoKPIs } = useDemoMode();
  
  // Refs para controlar requests e debounce
  const loadController = useRef<AbortController | null>(null);
  const loadTimer = useRef<NodeJS.Timeout | null>(null);

  const loadKPIs = useCallback(async () => {
    try {
      if (isDemoMode) {
        const demoData = getDemoKPIs();
        setKPIs(demoData);
        return;
      }

      if (!companyId) {
        setKPIs(defaultKPIs);
        return;
      }

      const result = await KPILoaderService.loadKPIs(companyId, periodDays);
      setKPIs(result);
    } catch (error) {
      console.warn("Erro no carregamento de KPIs:", error);
      setKPIs(defaultKPIs);
    }
  }, [companyId, periodDays, isDemoMode, getDemoKPIs]);

  useEffect(() => {
    // Debounce para evitar múltiplas chamadas
    if (loadTimer.current) {
      clearTimeout(loadTimer.current);
    }

    // Cancelar request anterior
    if (loadController.current) {
      loadController.current.abort();
    }

    loadController.current = new AbortController();
    setLoading(true);

    loadTimer.current = setTimeout(async () => {
      try {
        await loadKPIs();
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => {
      if (loadTimer.current) {
        clearTimeout(loadTimer.current);
      }
      if (loadController.current) {
        loadController.current.abort();
      }
    };
  }, [loadKPIs]);

  return { kpis, loading, refresh: loadKPIs };
};
