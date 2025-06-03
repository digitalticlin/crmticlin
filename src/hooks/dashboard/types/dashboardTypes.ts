
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

export const defaultKPIs: DashboardKPIsWithTrends = {
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
