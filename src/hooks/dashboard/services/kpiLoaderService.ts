
import { DashboardKPIsWithTrends, defaultKPIs } from "../types/dashboardTypes";
import { KPICalculatorService } from "./kpiCalculatorService";

export class KPILoaderService {
  static async loadKPIs(companyId: string, periodDays: string): Promise<DashboardKPIsWithTrends> {
    try {
      console.log(`Carregando KPIs para empresa ${companyId}, período: ${periodDays} dias`);
      
      const days = parseInt(periodDays) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Período anterior para comparação
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date();
      prevStartDate.setDate(prevEndDate.getDate() - days);

      console.log(`Período atual: ${startDate.toDateString()} até ${endDate.toDateString()}`);
      console.log(`Período anterior: ${prevStartDate.toDateString()} até ${prevEndDate.toDateString()}`);

      // Calcular KPIs para período atual
      const currentKPIs = await KPICalculatorService.calculateKPIsForPeriod(
        companyId, 
        startDate, 
        endDate
      );

      // Calcular KPIs para período anterior
      const previousKPIs = await KPICalculatorService.calculateKPIsForPeriod(
        companyId, 
        prevStartDate, 
        prevEndDate
      );

      // Calcular trends
      const trends = {
        novos_leads: KPICalculatorService.calculateTrend(currentKPIs.novos_leads, previousKPIs.novos_leads),
        total_leads: KPICalculatorService.calculateTrend(currentKPIs.total_leads, previousKPIs.total_leads),
        taxa_conversao: KPICalculatorService.calculateTrend(currentKPIs.taxa_conversao, previousKPIs.taxa_conversao),
        taxa_perda: KPICalculatorService.calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda),
        valor_pipeline: KPICalculatorService.calculateTrend(currentKPIs.valor_pipeline, previousKPIs.valor_pipeline),
        ticket_medio: KPICalculatorService.calculateTrend(currentKPIs.ticket_medio, previousKPIs.ticket_medio),
        tempo_resposta: KPICalculatorService.calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta),
      };

      const result = {
        ...currentKPIs,
        trends
      };

      console.log("KPIs carregados com sucesso:", result);
      return result;

    } catch (error) {
      console.error("Erro no carregamento de KPIs:", error);
      console.log("Retornando dados padrão devido ao erro");
      return defaultKPIs;
    }
  }
}
