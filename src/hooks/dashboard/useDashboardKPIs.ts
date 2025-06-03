
import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (isDemoMode) {
      // Usar dados demo
      console.log("Usando dados de demonstração");
      setKPIs(getDemoKPIs());
      setLoading(false);
    } else if (companyId) {
      loadKPIs();
    } else {
      setLoading(false);
    }
  }, [companyId, periodDays, isDemoMode]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const result = await KPILoaderService.loadKPIs(companyId!, periodDays);
      setKPIs(result);
    } catch (error) {
      console.error("Erro no carregamento de KPIs:", error);
      // Em caso de erro, manter dados padrão
      setKPIs(defaultKPIs);
    } finally {
      setLoading(false);
    }
  };

  return { kpis, loading, refresh: loadKPIs };
};
