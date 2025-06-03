
import { DashboardKPIs, KPITrend } from "../types/dashboardTypes";
import { KPIQueryService } from "./kpiQueryService";

export class KPICalculatorService {
  // Cálculo KPIs de forma segura
  static async calculateKPIsForPeriod(companyId: string, startDate: Date, endDate: Date): Promise<DashboardKPIs> {
    // Etapa 1: Buscar leads
    const leads = await KPIQueryService.fetchLeadsBasic(companyId, startDate, endDate);
    console.log(`Período ${startDate.toDateString()}: ${leads.length} leads encontrados`);

    // Etapa 2: Buscar estágios apenas se há leads
    const stageIds = [...new Set(leads.map(l => l.kanban_stage_id).filter(Boolean))];
    const stages = await KPIQueryService.fetchStages(stageIds);
    
    // Mapear estágios por ID
    const stageMap = new Map(stages.map(s => [s.id, s]));

    // Cálculos básicos
    const totalLeads = leads.length;
    const novosLeads = totalLeads;

    // Contagem de leads ganhos/perdidos
    let leadsGanhos = 0;
    let leadsPerdidos = 0;
    let valorTotal = 0;
    let valorGanhos = 0;

    leads.forEach(lead => {
      const stage = stageMap.get(lead.kanban_stage_id);
      const valor = lead.purchase_value || 0;
      
      valorTotal += valor;
      
      if (stage?.is_won) {
        leadsGanhos++;
        valorGanhos += valor;
      } else if (stage?.is_lost) {
        leadsPerdidos++;
      }
    });

    // Cálculos finais
    const taxaConversao = totalLeads > 0 ? (leadsGanhos / totalLeads) * 100 : 0;
    const taxaPerda = totalLeads > 0 ? (leadsPerdidos / totalLeads) * 100 : 0;
    const ticketMedio = leadsGanhos > 0 ? valorGanhos / leadsGanhos : 0;

    return {
      novos_leads: novosLeads,
      total_leads: totalLeads,
      taxa_conversao: Math.round(taxaConversao * 100) / 100,
      taxa_perda: Math.round(taxaPerda * 100) / 100,
      valor_pipeline: valorTotal,
      ticket_medio: Math.round(ticketMedio * 100) / 100,
      tempo_resposta: 0 // Placeholder
    };
  }

  static calculateTrend(current: number, previous: number): KPITrend {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    }
    
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(percentChange * 100) / 100),
      isPositive: percentChange >= 0
    };
  }
}
