
import { supabase } from "@/integrations/supabase/client";

export class KPIQueryService {
  // Query simples para verificar conectividade
  static async checkConnection(): Promise<boolean> {
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
  }

  // Query gradual 1: Buscar leads básicos
  static async fetchLeadsBasic(companyId: string, startDate: Date, endDate: Date) {
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
  }

  // Query gradual 2: Buscar estágios (separado)
  static async fetchStages(stageIds: string[]) {
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
  }
}
