
// Simplified dashboard config service that doesn't rely on non-existent tables
export interface DashboardConfig {
  id: string;
  userId: string;
  layoutConfig: any;
  updatedAt: string;
}

export const dashboardConfigService = {
  // Return default config since we don't have dashboard_configs table yet
  async getConfig(userId: string): Promise<DashboardConfig | null> {
    return {
      id: 'default',
      userId,
      layoutConfig: {
        // ✅ CORREÇÃO: Estrutura correta esperada pelo validateConfig
        kpis: {
          novos_leads: true,
          total_leads: true,
          taxa_conversao: true,
          taxa_perda: true,
          valor_pipeline: false,
          ticket_medio: false,
          tempo_resposta: false
        },
        charts: {
          funil_conversao: true,
          performance_vendedores: true,
          evolucao_temporal: false,
          leads_etiquetas: false,
          distribuicao_fonte: false
        },
        layout: {
          kpi_order: ["novos_leads", "total_leads", "taxa_conversao", "taxa_perda", "valor_pipeline", "ticket_medio", "tempo_resposta"],
          chart_order: ["funil_conversao", "performance_vendedores", "evolucao_temporal", "leads_etiquetas", "distribuicao_fonte"]
        },
        period_filter: "30"
      },
      updatedAt: new Date().toISOString()
    };
  },

  // Placeholder for future implementation
  async saveConfig(userId: string, config: any): Promise<void> {
    console.log('Dashboard config would be saved:', { userId, config });
    // TODO: Implement when dashboard_configs table is created
  }
};
