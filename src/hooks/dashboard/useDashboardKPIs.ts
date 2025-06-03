
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

export const useDashboardKPIs = (periodDays: string) => {
  const [kpis, setKPIs] = useState<DashboardKPIs>({
    novos_leads: 0,
    total_leads: 0,
    taxa_conversao: 0,
    taxa_perda: 0,
    valor_pipeline: 0,
    ticket_medio: 0,
    tempo_resposta: 0
  });
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadKPIs();
    }
  }, [companyId, periodDays]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      
      const daysAgo = parseInt(periodDays);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

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
        .gte('created_at', startDate.toISOString());

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
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      // Calcular KPIs
      const totalLeads = leadsData?.length || 0;
      const novosLeads = leadsData?.filter(lead => 
        new Date(lead.created_at) >= startDate
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

      setKPIs({
        novos_leads: novosLeads,
        total_leads: totalLeads,
        taxa_conversao: Math.round(taxaConversao * 100) / 100,
        taxa_perda: Math.round(taxaPerda * 100) / 100,
        valor_pipeline: valorPipeline,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        tempo_resposta: Math.round(tempoMedioResposta * 100) / 100
      });

    } catch (error) {
      console.error("Erro ao carregar KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  return { kpis, loading, refresh: loadKPIs };
};
