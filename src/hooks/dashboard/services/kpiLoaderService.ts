
import { DashboardKPIsWithTrends, defaultKPIs } from "../types/dashboardTypes";
import { KPIQueryService } from "./kpiQueryService";
import { KPICalculatorService } from "./kpiCalculatorService";

export class KPILoaderService {
  static async loadKPIs(companyId: string, periodDays: string): Promise<DashboardKPIsWithTrends> {
    console.log("=== Iniciando carregamento robusto de KPIs ===");
    
    // Verificar conectividade primeiro
    console.log("1. Verificando conectividade...");
    const isConnected = await KPIQueryService.checkConnection();
    if (!isConnected) {
      console.warn("Sem conectividade - usando dados padrão");
      return defaultKPIs;
    }
    console.log("✓ Conectividade OK");

    // Calcular datas
    const daysAgo = parseInt(periodDays) || 30;
    const currentEndDate = new Date();
    const currentStartDate = new Date();
    currentStartDate.setDate(currentStartDate.getDate() - daysAgo);

    const previousEndDate = new Date(currentStartDate);
    const previousStartDate = new Date();
    previousStartDate.setDate(previousEndDate.getDate() - daysAgo);

    console.log("2. Calculando KPIs período atual...");
    const currentKPIs = await KPICalculatorService.calculateKPIsForPeriod(companyId, currentStartDate, currentEndDate);
    console.log("✓ KPIs período atual:", currentKPIs);
    
    console.log("3. Calculando KPIs período anterior...");
    const previousKPIs = await KPICalculatorService.calculateKPIsForPeriod(companyId, previousStartDate, previousEndDate);
    console.log("✓ KPIs período anterior:", previousKPIs);

    // Calcular tendências
    const trends = {
      novos_leads: KPICalculatorService.calculateTrend(currentKPIs.novos_leads, previousKPIs.novos_leads),
      total_leads: KPICalculatorService.calculateTrend(currentKPIs.total_leads, previousKPIs.total_leads),
      taxa_conversao: KPICalculatorService.calculateTrend(currentKPIs.taxa_conversao, previousKPIs.taxa_conversao),
      taxa_perda: {
        ...KPICalculatorService.calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda),
        isPositive: !KPICalculatorService.calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda).isPositive
      },
      valor_pipeline: KPICalculatorService.calculateTrend(currentKPIs.valor_pipeline, previousKPIs.valor_pipeline),
      ticket_medio: KPICalculatorService.calculateTrend(currentKPIs.ticket_medio, previousKPIs.ticket_medio),
      tempo_resposta: {
        ...KPICalculatorService.calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta),
        isPositive: !KPICalculatorService.calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta).isPositive
      }
    };

    const finalKPIs = {
      ...currentKPIs,
      trends
    };

    console.log("✓ KPIs finais calculados:", finalKPIs);
    console.log("=== Carregamento de KPIs finalizado ===");
    
    return finalKPIs;
  }
}
