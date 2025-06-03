
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
  tempo_resposta: number;
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

const defaultKPIs: DashboardKPIsWithTrends = {
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
};

export const useDashboardKPIs = (periodDays: string) => {
  const [kpis, setKPIs] = useState<DashboardKPIsWithTrends>(defaultKPIs);
  const [loading, setLoading] = useState(true);
  const { companyId } = useCompanyData();

  useEffect(() => {
    if (companyId) {
      loadKPIs();
    } else {
      setLoading(false);
    }
  }, [companyId, periodDays]);

  // Query simples para verificar conectividade
  const checkConnection = async (): Promise<boolean> => {
    try {
      const { error } = await Promise.race([
        supabase.from('leads').select('id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]) as any;
      return !error;
    } catch {
      return false;
    }
  };

  // Query gradual 1: Buscar leads básicos
  const fetchLeadsBasic = async (startDate: Date, endDate: Date) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, created_at, purchase_value, kanban_stage_id')
        .eq('company_id', companyId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Erro ao buscar leads básicos:", error);
      return [];
    }
  };

  // Query gradual 2: Buscar estágios (separado)
  const fetchStages = async (stageIds: string[]) => {
    if (stageIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('id, is_won, is_lost')
        .in('id', stageIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Erro ao buscar estágios:", error);
      return [];
    }
  };

  // Cálculo KPIs de forma segura
  const calculateKPIsForPeriod = async (startDate: Date, endDate: Date) => {
    // Etapa 1: Buscar leads
    const leads = await fetchLeadsBasic(startDate, endDate);
    console.log(`Período ${startDate.toDateString()}: ${leads.length} leads encontrados`);

    // Etapa 2: Buscar estágios apenas se há leads
    const stageIds = [...new Set(leads.map(l => l.kanban_stage_id).filter(Boolean))];
    const stages = await fetchStages(stageIds);
    
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
      console.log("=== Iniciando carregamento robusto de KPIs ===");
      
      // Verificar conectividade primeiro
      console.log("1. Verificando conectividade...");
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.warn("Sem conectividade - usando dados padrão");
        setKPIs(defaultKPIs);
        return;
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
      const currentKPIs = await calculateKPIsForPeriod(currentStartDate, currentEndDate);
      console.log("✓ KPIs período atual:", currentKPIs);
      
      console.log("3. Calculando KPIs período anterior...");
      const previousKPIs = await calculateKPIsForPeriod(previousStartDate, previousEndDate);
      console.log("✓ KPIs período anterior:", previousKPIs);

      // Calcular tendências
      const trends = {
        novos_leads: calculateTrend(currentKPIs.novos_leads, previousKPIs.novos_leads),
        total_leads: calculateTrend(currentKPIs.total_leads, previousKPIs.total_leads),
        taxa_conversao: calculateTrend(currentKPIs.taxa_conversao, previousKPIs.taxa_conversao),
        taxa_perda: {
          ...calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda),
          isPositive: !calculateTrend(currentKPIs.taxa_perda, previousKPIs.taxa_perda).isPositive
        },
        valor_pipeline: calculateTrend(currentKPIs.valor_pipeline, previousKPIs.valor_pipeline),
        ticket_medio: calculateTrend(currentKPIs.ticket_medio, previousKPIs.ticket_medio),
        tempo_resposta: {
          ...calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta),
          isPositive: !calculateTrend(currentKPIs.tempo_resposta, previousKPIs.tempo_resposta).isPositive
        }
      };

      const finalKPIs = {
        ...currentKPIs,
        trends
      };

      console.log("✓ KPIs finais calculados:", finalKPIs);
      setKPIs(finalKPIs);

    } catch (error) {
      console.error("Erro no carregamento de KPIs:", error);
      // Em caso de erro, manter dados padrão
      setKPIs(defaultKPIs);
    } finally {
      setLoading(false);
      console.log("=== Carregamento de KPIs finalizado ===");
    }
  };

  return { kpis, loading, refresh: loadKPIs };
};
