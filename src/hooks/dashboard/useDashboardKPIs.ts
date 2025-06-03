
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

  console.log("useDashboardKPIs - periodDays:", periodDays, "companyId:", companyId, "isDemoMode:", isDemoMode);

  useEffect(() => {
    const loadData = async () => {
      console.log("useDashboardKPIs - iniciando carregamento");
      setLoading(true);
      
      try {
        if (isDemoMode) {
          console.log("useDashboardKPIs - usando dados de demonstração");
          const demoData = getDemoKPIs();
          setKPIs(demoData);
        } else if (companyId) {
          console.log("useDashboardKPIs - carregando dados reais para empresa:", companyId);
          await loadKPIs();
        } else {
          console.log("useDashboardKPIs - sem companyId, usando dados padrão");
          setKPIs(defaultKPIs);
        }
      } catch (error) {
        console.error("useDashboardKPIs - erro no carregamento:", error);
        setKPIs(defaultKPIs);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, periodDays, isDemoMode, getDemoKPIs]);

  const loadKPIs = async () => {
    try {
      console.log("useDashboardKPIs - chamando KPILoaderService");
      const result = await KPILoaderService.loadKPIs(companyId!, periodDays);
      console.log("useDashboardKPIs - resultado recebido:", result);
      setKPIs(result);
    } catch (error) {
      console.error("useDashboardKPIs - erro no carregamento de KPIs:", error);
      setKPIs(defaultKPIs);
    }
  };

  console.log("useDashboardKPIs - retornando:", { kpis, loading });

  return { kpis, loading, refresh: loadKPIs };
};
