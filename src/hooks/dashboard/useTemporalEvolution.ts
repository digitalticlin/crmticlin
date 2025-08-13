import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TemporalPoint {
  name: string; // label (ex.: 12/08)
  date: string; // YYYY-MM-DD
  leads: number;
  converted: number; // deals won
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useTemporalEvolution(periodFilter: string) {
  const { user } = useAuth();

  return useQuery<TemporalPoint[]>({
    queryKey: ["temporal-evolution", user?.id, periodFilter],
    queryFn: async () => {
      if (!user?.id) return [];

      const days = parseInt(periodFilter || '30', 10) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      // Base series with zeros
      const series: Record<string, TemporalPoint> = {};
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = toYMD(d);
        series[key] = {
          name: formatDateLabel(new Date(d)),
          date: key,
          leads: 0,
          converted: 0,
        };
      }

      const PAGE_SIZE = 1000;

      // Leads criados no período
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('leads')
          .select('created_at', { count: 'exact' })
          .eq('created_by_user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', new Date(endDate.getTime() + 1).toISOString())
          .order('created_at', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        (data || []).forEach((row: any) => {
          const d = new Date(row.created_at);
          const ymd = toYMD(d);
          if (series[ymd]) series[ymd].leads += 1;
        });
        if (!data || data.length < PAGE_SIZE) break;
      }

      // Deals ganhas no período
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('deals')
          .select('date, status')
          .eq('created_by_user_id', user.id)
          .eq('status', 'won')
          .gte('date', startDate.toISOString())
          .lte('date', new Date(endDate.getTime() + 1).toISOString())
          .order('date', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        (data || []).forEach((row: any) => {
          const d = new Date(row.date);
          const ymd = toYMD(d);
          if (series[ymd]) series[ymd].converted += 1;
        });
        if (!data || data.length < PAGE_SIZE) break;
      }

      return Object.values(series);
    },
    enabled: !!user?.id,
  });
}


