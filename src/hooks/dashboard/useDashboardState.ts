
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useDemoMode } from "@/hooks/dashboard/useDemoMode";
import { DashboardKPIsWithTrends, defaultKPIs } from "./types/dashboardTypes";
import { DashboardConfig } from "./useDashboardConfig";
import { KPILoaderService } from "./services/kpiLoaderService";

interface DashboardStateCache {
  kpis: DashboardKPIsWithTrends;
  timestamp: number;
  periodDays: string;
  companyId: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useDashboardState = (periodDays: string, config?: DashboardConfig) => {
  const [kpis, setKPIs] = useState<DashboardKPIsWithTrends>(defaultKPIs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { companyId } = useCompanyData();
  const { isDemoMode, getDemoKPIs } = useDemoMode();
  
  // Cache e controle de estado
  const cacheRef = useRef<DashboardStateCache | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback((cache: DashboardStateCache | null): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    const isExpired = now - cache.timestamp > CACHE_TTL;
    const isSameParams = cache.periodDays === periodDays && cache.companyId === companyId;
    
    return !isExpired && isSameParams;
  }, [periodDays, companyId]);

  // Carregamento otimizado com cache
  const loadKPIs = useCallback(async (force = false) => {
    // Verificar cache primeiro
    if (!force && isCacheValid(cacheRef.current)) {
      console.log("useDashboardState - usando cache");
      setKPIs(cacheRef.current!.kpis);
      setLoading(false);
      setError(null);
      return;
    }

    // Evitar múltiplas execuções simultâneas
    if (loadingRef.current) {
      console.log("useDashboardState - loading já em progresso");
      return;
    }

    if (!mountedRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log("useDashboardState - carregando dados");

      let result: DashboardKPIsWithTrends;

      if (isDemoMode) {
        console.log("useDashboardState - usando dados demo");
        result = getDemoKPIs();
      } else if (companyId) {
        console.log("useDashboardState - carregando dados reais");
        
        // Timeout reduzido para 5 segundos
        const loadPromise = KPILoaderService.loadKPIs(companyId, periodDays);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        result = await Promise.race([loadPromise, timeoutPromise]);
      } else {
        console.log("useDashboardState - sem companyId, usando padrão");
        result = defaultKPIs;
      }

      if (!mountedRef.current) return;

      // Atualizar cache
      cacheRef.current = {
        kpis: result,
        timestamp: Date.now(),
        periodDays,
        companyId: companyId || ''
      };

      setKPIs(result);
      setError(null);
      retryCountRef.current = 0;

    } catch (err) {
      console.error("useDashboardState - erro no carregamento:", err);
      
      if (!mountedRef.current) return;

      // Implementar retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`useDashboardState - tentativa ${retryCountRef.current}/${maxRetries}`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            loadKPIs(true);
          }
        }, 1000 * retryCountRef.current);
        return;
      }

      // Se falhou após retries, usar dados do cache se disponível
      if (cacheRef.current) {
        console.log("useDashboardState - usando cache após erro");
        setKPIs(cacheRef.current.kpis);
        setError("Dados podem estar desatualizados");
      } else {
        setKPIs(defaultKPIs);
        setError("Erro ao carregar dados");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [companyId, periodDays, isDemoMode, getDemoKPIs, isCacheValid]);

  // Effect principal
  useEffect(() => {
    mountedRef.current = true;
    loadKPIs();

    return () => {
      mountedRef.current = false;
      loadingRef.current = false;
    };
  }, [loadKPIs]);

  // Refresh function memoizada
  const refresh = useCallback(() => {
    console.log("useDashboardState - refresh manual");
    loadKPIs(true);
  }, [loadKPIs]);

  // Valores memoizados
  const value = useMemo(() => ({
    kpis,
    loading,
    error,
    refresh
  }), [kpis, loading, error, refresh]);

  return value;
};
