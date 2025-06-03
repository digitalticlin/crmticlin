
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
      const currentKPIsRaw = await Promise.race([
        currentKPIsPromise,
        new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao calcular KPIs atuais')), 10000)
        )
      ]);

      // Garantir que temos a estrutura correta
      const currentKPIs = {
        novos_leads: currentKPIsRaw?.novos_leads || 0,
        total_leads: currentKPIsRaw?.total_leads || 0,
        taxa_conversao: currentKPIsRaw?.taxa_conversao || 0,
        taxa_perda: currentKPIsRaw?.taxa_perda || 0,
        valor_pipeline: currentKPIsRaw?.valor_pipeline || 0,
        ticket_medio: currentKPIsRaw?.ticket_medio || 0,
        tempo_resposta: currentKPIsRaw?.tempo_resposta || 0,
      };

      console.log("KPILoaderService - KPIs atuais calculados:", currentKPIs);

      // Calcular KPIs para período anterior com timeout
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
            setTimeout(() => reject(new Error('Timeout ao calcular KPIs anteriores')), 8000)
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

        console.log("KPILoaderService - KPIs anteriores calculados:", previousKPIs);
      } catch (error) {
        console.warn("KPILoaderService - Erro ao calcular KPIs anteriores, usando padrão:", error);
      }

      // Calcular trends com validação
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

      console.log("KPILoaderService - Resultado final:", result);
      return result;

    } catch (error) {
      console.error("KPILoaderService - Erro no carregamento de KPIs:", error);
      console.log("KPILoaderService - Retornando dados padrão devido ao erro");
      return defaultKPIs;
    }
  }
}
