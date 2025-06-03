
import { useState, useEffect, useCallback, useRef } from "react";
import { useCompanyData } from "@/hooks/useCompanyData";
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
  const { companyId, loading: companyLoading } = useCompanyData();
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadKPIs = useCallback(async () => {
    // Evitar execuções em paralelo
    if (isLoadingRef.current || companyLoading) return;
    
    isLoadingRef.current = true;
    
    try {
      if (!companyId) {
        setKPIs(defaultKPIs);
        return;
      }

      const result = await KPILoaderService.loadKPIs(companyId, periodDays);
      
      if (isMountedRef.current) {
        setKPIs(result);
      }
    } catch (error) {
      console.warn("Erro no carregamento de KPIs:", error);
      if (isMountedRef.current) {
        setKPIs(defaultKPIs);
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [companyId, periodDays, companyLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (companyLoading) return; // Aguardar companyData carregar
    
    setLoading(true);
    
    // Timeout reduzido para 50ms
    const timer = setTimeout(async () => {
      if (isMountedRef.current) {
        await loadKPIs();
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, [loadKPIs, companyLoading]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
    };
  }, []);

  return { kpis, loading, refresh: loadKPIs };
};
