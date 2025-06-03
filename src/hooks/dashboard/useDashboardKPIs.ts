
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";

export interface DashboardKPIs {
  novos_leads: number;
  total_leads: number;
  taxa_conversao: number;
  taxa_perda: number;
  valor_pipeline: number;
  ticket_medio: number;
  tempo_resposta: number; // em minutos
}

export interface KPITrend {
  value: number;
  isPositive: boolean;
}

export interface DashboardKPIsWithTrends extends DashboardKPIs {
  trends: {
    novos_leads: KPITrend;
    total_leads: KPITrend;
    taxa_conversao: KPITrend;
    taxa_perda: KPITrend;
    valor_pipeline: KPITrend;
    ticket_medio: KPITrend;
    tempo_resposta: KPITrend;
  };
}

export const useDashboardKPIs = (periodDays: string) => {
  const [kpis, setKPIs] = useState<DashboardKPIsWithTrends>({
    novos_leads: 0,
    total_leads: 0,
    taxa_conversao: 0,
    taxa_perda: 0,
    valor_pipeline: 0,
    ticket_medio: 0,
    tempo_resposta: 0,
    trends: {
      novos_leads: { value: 0, isPositive: true },
      total_leads: { value: 0, isPositive: true },
      taxa_conversao: { value: 0, isPositive: true },
      taxa_perda: { value: 0, isPositive: false },
      valor_pipeline: { value: 0, isPositive: true },
      ticket_medio: { value: 0, isPositive: true },
      tempo_resposta: { value: 0, isPositive: false },
    }
  });
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadKPIs();
    }
  }, [companyId, periodDays]);

  const calculateKPIsForPeriod = async (startDate: Date, endDate: Date) => {
    // Buscar dados dos leads
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        purchase_value,
        last_message_time,
        kanban_stage_id,
        kanban_stages!inner(is_won, is_lost)
      `)
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (leadsError) throw leadsError;

    // Buscar tempo de resposta das mensagens
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select(`
        timestamp,
        from_me,
        lead_id,
        leads!inner(created_at, company_id)
      `)
      .eq('leads.company_id', companyId)
      .eq('from_me', true)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    if (messagesError) throw messagesError;

    // Calcular KPIs
    const totalLeads = leadsData?.length || 0;
    const novosLeads = leadsData?.filter(lead => 
      new Date(lead.created_at) >= startDate && new Date(lead.created_at) <= endDate
    ).length || 0;

    const leadsGanhos = leadsData?.filter(lead => 
      lead.kanban_stages?.is_won
    ).length || 0;

    const leadsPerdidos = leadsData?.filter(lead => 
      lead.kanban_stages?.is_lost
    ).length || 0;

    const taxaConversao = totalLeads > 0 ? (leadsGanhos / totalLeads) * 100 : 0;
    const taxaPerda = totalLeads > 0 ? (leadsPerdidos / totalLeads) * 100 : 0;

    const valorPipeline = leadsData?.reduce((sum, lead) => 
      sum + (lead.purchase_value || 0), 0
    ) || 0;

    const ticketMedio = leadsGanhos > 0 
      ? (leadsData?.filter(lead => lead.kanban_stages?.is_won)
          .reduce((sum, lead) => sum + (lead.purchase_value || 0), 0) || 0) / leadsGanhos
      : 0;

    // Calcular tempo médio de resposta
    const temposResposta: number[] = [];
    
    if (messagesData) {
      const leadsMap = new Map();
      
      messagesData.forEach(message => {
        const leadId = message.lead_id;
        const leadCreatedAt = new Date(message.leads.created_at);
        const messageTime = new Date(message.timestamp);
        
        if (!leadsMap.has(leadId)) {
          const tempoResposta = (messageTime.getTime() - leadCreatedAt.getTime()) / (1000 * 60); // em minutos
          if (tempoResposta > 0) {
            temposResposta.push(tempoResposta);
            leadsMap.set(leadId, true);
          }
        }
      });
    }

    const tempoMedioResposta = temposResposta.length > 0 
      ? temposResposta.reduce((sum, tempo) => sum + tempo, 0) / temposResposta.length
      : 0;

    return {
      novos_leads: novosLeads,
      total_leads: totalLeads,
      taxa_conversao: Math.round(taxaConversao * 100) / 100,
      taxa_perda: Math.round(taxaPerda * 100) / 100,
      valor_pipeline: valorPipeline,
      ticket_medio: Math.round(ticketMedio * 100) / 100,
      tempo_resposta: Math.round(tempoMedioResposta * 100) / 100
    };
  };

  const calculateTrend = (current: number, previous: number): KPITrend => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    }
    
    const percentChange = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(percentChange * 100) / 100),
      isPositive: percentChange >= 0
    };
  };

  const loadKPIs = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const currentEndDate = new Date();
      const currentStartDate = new Date();
      currentStartDate.setDate(currentStartDate.getDate() - daysAgo);

      // Período anterior para comparação
      const previousEndDate = new Date(currentStartDate);
      const previousStartDate = new Date();
      previousStartDate.setDate(previousEndDate.getDate() - daysAgo);

      // Calcular KPIs para período atual
      const currentKPIs = await calculateKPIsForPeriod(currentStartDate, currentEndDate);
      
      // Calcular KPIs para período anterior
      const previousKPIs = await calculateKPIsForPeriod(previousStartDate, previousEndDate);

      // Calcular tendências
      const trends = {
        novos_leads: calculateTrend(currentKPIs.novos_leads, previousKPIs.novos_leads),
        total_leads: calculateTrend(currentKPIs.total_leads, previousKPIs.total_leads),
        taxa_conversao: calculateTrend(currentKPIs.taxa_conversao, previousKPIs.taxa_conversao),
        taxa_perda: {
          ...calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda),
          isPositive: !calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda).isPositive // Inverter para taxa de perda
        },
        valor_pipeline: calculateTrend(currentKPIs.valor_pipeline, previousKPIs.valor_pipeline),
        ticket_medio: calculateTrend(currentKPIs.ticket_medio, previousKPIs.ticket_medio),
        tempo_resposta: {
          ...calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta),
          isPositive: !calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta).isPositive // Inverter para tempo de resposta
        }
      };

      setKPIs({
        ...currentKPIs,
        trends
      });

    } catch (error) {
      console.error("Erro ao carregar KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { kpis, loading, refresh: loadKPIs };
};
