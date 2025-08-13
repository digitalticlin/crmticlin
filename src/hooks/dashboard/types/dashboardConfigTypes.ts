
export interface DashboardConfig {
  kpis: {
    novos_leads: boolean;
    total_leads: boolean;
    taxa_conversao: boolean;
    taxa_perda: boolean;
    valor_pipeline: boolean;
    ticket_medio: boolean;
  };
  charts: {
    funil_conversao: boolean;
    performance_vendedores: boolean;
    evolucao_temporal: boolean;
    leads_etiquetas: boolean;
  };
  layout: {
    kpi_order: string[];
    chart_order: string[];
  };
  period_filter: string;
}

export const defaultConfig: DashboardConfig = {
  kpis: {
    novos_leads: true,
    total_leads: true,
    taxa_conversao: true,
    taxa_perda: true,
    valor_pipeline: false,
    ticket_medio: false
  },
  charts: {
    funil_conversao: true,
    performance_vendedores: true,
    evolucao_temporal: true,
    leads_etiquetas: false
  },
  layout: {
    kpi_order: ["novos_leads", "total_leads", "taxa_conversao", "taxa_perda", "valor_pipeline", "ticket_medio"],
    chart_order: ["funil_conversao", "performance_vendedores", "evolucao_temporal", "leads_etiquetas"]
  },
  period_filter: "30"
};
