
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadKPIs = useCallback(async () => {
    // Evitar execuções em paralelo
    if (isLoadingRef.current || companyLoading || !isMountedRef.current) return;
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    isLoadingRef.current = true;
    
    try {
      if (!companyId) {
        if (isMountedRef.current) {
          setKPIs(defaultKPIs);
        }
        return;
      }

      const result = await KPILoaderService.loadKPIs(companyId, periodDays);
      
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setKPIs(result);
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.warn("Erro no carregamento de KPIs:", error);
        if (isMountedRef.current) {
          setKPIs(defaultKPIs);
        }
      }
    } finally {
      if (isMountedRef.current) {
        isLoadingRef.current = false;
      }
    }
  }, [companyId, periodDays, companyLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (companyLoading) return; // Aguardar companyData carregar
    
    setLoading(true);
    
    // Timeout unificado para 100ms
    const timer = setTimeout(async () => {
      if (isMountedRef.current) {
        await loadKPIs();
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [loadKPIs, companyLoading]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isLoadingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { kpis, loading, refresh: loadKPIs };
};
