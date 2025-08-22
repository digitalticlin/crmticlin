
import { supabase } from '@/integrations/supabase/client';
import { DashboardConfig } from '../types/dashboardConfigTypes';

export const dashboardConfigService = {
  async getDashboardConfig(userId: string): Promise<DashboardConfig | null> {
    try {
      // Mock implementation since the table might not exist
      return {
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
    } catch (error) {
      console.error('Erro ao buscar configuração do dashboard:', error);
      return null;
    }
  },

  async saveDashboardConfig(userId: string, config: DashboardConfig): Promise<boolean> {
    try {
      // Mock implementation since the table might not exist
      console.log('Salvando configuração do dashboard:', { userId, config });
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração do dashboard:', error);
      return false;
    }
  }
};
