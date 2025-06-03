
import { DashboardKPIsWithTrends, defaultKPIs } from "../types/dashboardTypes";
import { KPICalculatorService } from "./kpiCalculatorService";

export class KPILoaderService {
  static async loadKPIs(companyId: string, periodDays: string): Promise<DashboardKPIsWithTrends> {
    try {
      console.log(`KPILoaderService - Carregando KPIs para empresa ${companyId}, período: ${periodDays} dias`);
      
      // Validação de entrada
      if (!companyId || !periodDays) {
        console.warn("KPILoaderService - parâmetros inválidos, retornando dados padrão");
        return defaultKPIs;
      }

      const days = parseInt(periodDays) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Período anterior para comparação
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date();
      prevStartDate.setDate(prevEndDate.getDate() - days);

      console.log(`KPILoaderService - Período atual: ${startDate.toDateString()} até ${endDate.toDateString()}`);
      console.log(`KPILoaderService - Período anterior: ${prevStartDate.toDateString()} até ${prevEndDate.toDateString()}`);

      // Calcular KPIs para período atual com timeout
      const currentKPIsPromise = KPICalculatorService.calculateKPIsForPeriod(
        companyId, 
        startDate, 
        endDate
      );

      // Timeout de 10 segundos para evitar travamento
      const currentKPIs = await Promise.race([
        currentKPIsPromise,
        new Promise<typeof defaultKPIs>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao calcular KPIs atuais')), 10000)
        )
      ]);

      console.log("KPILoaderService - KPIs atuais calculados:", currentKPIs);

      // Calcular KPIs para período anterior com timeout
      let previousKPIs = defaultKPIs;
      try {
        const previousKPIsPromise = KPICalculatorService.calculateKPIsForPeriod(
          companyId, 
          prevStartDate, 
          prevEndDate
        );

        previousKPIs = await Promise.race([
          previousKPIsPromise,
          new Promise<typeof defaultKPIs>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao calcular KPIs anteriores')), 8000)
          )
        ]);

        console.log("KPILoaderService - KPIs anteriores calculados:", previousKPIs);
      } catch (error) {
        console.warn("KPILoaderService - Erro ao calcular KPIs anteriores, usando padrão:", error);
      }

      // Calcular trends com validação
      const trends = {
        novos_leads: KPICalculatorService.calculateTrend(
          currentKPIs.novos_leads || 0, 
          previousKPIs.novos_leads || 0
        ),
        total_leads: KPICalculatorService.calculateTrend(
          currentKPIs.total_leads || 0, 
          previousKPIs.total_leads || 0
        ),
        taxa_conversao: KPICalculatorService.calculateTrend(
          currentKPIs.taxa_conversao || 0, 
          previousKPIs.taxa_conversao || 0
        ),
        taxa_perda: KPICalculatorService.calculateTrend(
          currentKPIs.taxa_perda || 0, 
          previousKPIs.taxa_perda || 0
        ),
        valor_pipeline: KPICalculatorService.calculateTrend(
          currentKPIs.valor_pipeline || 0, 
          previousKPIs.valor_pipeline || 0
        ),
        ticket_medio: KPICalculatorService.calculateTrend(
          currentKPIs.ticket_medio || 0, 
          previousKPIs.ticket_medio || 0
        ),
        tempo_resposta: KPICalculatorService.calculateTrend(
          currentKPIs.tempo_resposta || 0, 
          previousKPIs.tempo_resposta || 0
        ),
      };

      const result: DashboardKPIsWithTrends = {
        novos_leads: currentKPIs.novos_leads || 0,
        total_leads: currentKPIs.total_leads || 0,
        taxa_conversao: currentKPIs.taxa_conversao || 0,
        taxa_perda: currentKPIs.taxa_perda || 0,
        valor_pipeline: currentKPIs.valor_pipeline || 0,
        ticket_medio: currentKPIs.ticket_medio || 0,
        tempo_resposta: currentKPIs.tempo_resposta || 0,
        trends
      };

      console.log("KPILoaderService - Resultado final:", result);
      return result;

    } catch (error) {
      console.error("KPILoaderService - Erro no carregamento de KPIs:", error);
      console.log("KPILoaderService - Retornando dados padrão devido ao erro");
      return defaultKPIs;
    }
  }
}
