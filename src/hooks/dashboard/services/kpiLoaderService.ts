
import { DashboardKPIsWithTrends, defaultKPIs } from "../types/dashboardTypes";
import { KPICalculatorService } from "./kpiCalculatorService";

// Cache simples para KPIs
const kpiCache = new Map<string, { data: DashboardKPIsWithTrends; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos para KPIs

export class KPILoaderService {
  static async loadKPIs(companyId: string, periodDays: string): Promise<DashboardKPIsWithTrends> {
    try {
      // Validação de entrada
      if (!companyId || !periodDays) {
        return defaultKPIs;
      }

      // Verificar cache primeiro
      const cacheKey = `${companyId}-${periodDays}`;
      const cached = kpiCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      const days = parseInt(periodDays) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Período anterior para comparação
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date();
      prevStartDate.setDate(prevEndDate.getDate() - days);

      // Calcular KPIs para período atual com timeout reduzido
      const currentKPIsPromise = KPICalculatorService.calculateKPIsForPeriod(
        companyId, 
        startDate, 
        endDate
      );

      // Timeout reduzido para 5 segundos
      const currentKPIsRaw = await Promise.race([
        currentKPIsPromise,
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao calcular KPIs atuais')), 5000)
        )
      ]);

      // Garantir estrutura correta
      const currentKPIs = {
        novos_leads: currentKPIsRaw?.novos_leads || 0,
        total_leads: currentKPIsRaw?.total_leads || 0,
        taxa_conversao: currentKPIsRaw?.taxa_conversao || 0,
        taxa_perda: currentKPIsRaw?.taxa_perda || 0,
        valor_pipeline: currentKPIsRaw?.valor_pipeline || 0,
        ticket_medio: currentKPIsRaw?.ticket_medio || 0,
        tempo_resposta: currentKPIsRaw?.tempo_resposta || 0,
      };

      // Calcular KPIs anteriores com timeout ainda menor
      let previousKPIs = {
        novos_leads: 0,
        total_leads: 0,
        taxa_conversao: 0,
        taxa_perda: 0,
        valor_pipeline: 0,
        ticket_medio: 0,
        tempo_resposta: 0,
      };
      
      try {
        const previousKPIsPromise = KPICalculatorService.calculateKPIsForPeriod(
          companyId, 
          prevStartDate, 
          prevEndDate
        );

        const previousKPIsRaw = await Promise.race([
          previousKPIsPromise,
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao calcular KPIs anteriores')), 3000)
          )
        ]);

        previousKPIs = {
          novos_leads: previousKPIsRaw?.novos_leads || 0,
          total_leads: previousKPIsRaw?.total_leads || 0,
          taxa_conversao: previousKPIsRaw?.taxa_conversao || 0,
          taxa_perda: previousKPIsRaw?.taxa_perda || 0,
          valor_pipeline: previousKPIsRaw?.valor_pipeline || 0,
          ticket_medio: previousKPIsRaw?.ticket_medio || 0,
          tempo_resposta: previousKPIsRaw?.tempo_resposta || 0,
        };
      } catch (error) {
        // Usar dados padrão se falhar
      }

      // Calcular trends
      const trends = {
        novos_leads: KPICalculatorService.calculateTrend(
          currentKPIs.novos_leads, 
          previousKPIs.novos_leads
        ),
        total_leads: KPICalculatorService.calculateTrend(
          currentKPIs.total_leads, 
          previousKPIs.total_leads
        ),
        taxa_conversao: KPICalculatorService.calculateTrend(
          currentKPIs.taxa_conversao, 
          previousKPIs.taxa_conversao
        ),
        taxa_perda: KPICalculatorService.calculateTrend(
          currentKPIs.taxa_perda, 
          previousKPIs.taxa_perda
        ),
        valor_pipeline: KPICalculatorService.calculateTrend(
          currentKPIs.valor_pipeline, 
          previousKPIs.valor_pipeline
        ),
        ticket_medio: KPICalculatorService.calculateTrend(
          currentKPIs.ticket_medio, 
          previousKPIs.ticket_medio
        ),
        tempo_resposta: KPICalculatorService.calculateTrend(
          currentKPIs.tempo_resposta, 
          previousKPIs.tempo_resposta
        ),
      };

      const result: DashboardKPIsWithTrends = {
        ...currentKPIs,
        trends
      };

      // Salvar no cache
      kpiCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;

    } catch (error) {
      console.warn("Erro no carregamento de KPIs:", error);
      return defaultKPIs;
    }
  }
}
