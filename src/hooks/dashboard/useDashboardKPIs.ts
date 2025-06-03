
import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(false);
  const { companyId } = useCompanyData();
  const { isDemoMode, getDemoKPIs } = useDemoMode();

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
    setLoading(true);
    
    const timer = setTimeout(async () => {
      try {
        await loadKPIs();
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [loadKPIs]);

  return { kpis, loading, refresh: loadKPIs };
};
