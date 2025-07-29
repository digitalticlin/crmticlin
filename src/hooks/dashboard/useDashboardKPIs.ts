
import { useQuery } from '@tanstack/react-query';

interface DashboardKPIData {
  novos_leads: number;
  total_leads: number;
  taxa_conversao: number;
  taxa_perda: number;
  valor_pipeline: number;
  ticket_medio: number;
  tempo_resposta: number;
}

export const useDashboardKPIs = (period: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-kpis', period],
    queryFn: async (): Promise<DashboardKPIData> => {
      // Mock data para desenvolvimento
      return {
        novos_leads: 45,
        total_leads: 234,
        taxa_conversao: 23.5,
        taxa_perda: 12.3,
        valor_pipeline: 125000,
        ticket_medio: 2350.75,
        tempo_resposta: 24
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    data: data || {
      novos_leads: 0,
      total_leads: 0,
      taxa_conversao: 0,
      taxa_perda: 0,
      valor_pipeline: 0,
      ticket_medio: 0,
      tempo_resposta: 0
    },
    isLoading,
    error
  };
};
