
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Retorna um relatório resumido por etapa para um funil.
 *
 * Estrutura retornada: [{ kanban_stage_id: string, count: number }]
 */
export function useFunnelDashboard(funnelId: string) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 🔧 FIX: Memoizar loadReport com useCallback para evitar loop infinito
  const loadReport = useCallback(async () => {
    if (!funnelId || !user?.id) {
      setReport([]);
      return;
    }

    setLoading(true);

    try {
      // 🚀 CORREÇÃO EMERGENCIAL: Filtro manual obrigatório (RLS desativado)
      console.log('[useFunnelDashboard] 🔧 PLANO B: Filtro manual ativo');

      // 1. Buscar profile do usuário logado
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)  // ✅ ID direto - profiles.id = auth.users.id
        .single();

      if (profileError || !userProfile) {
        console.error('[useFunnelDashboard] ❌ Profile não encontrado:', profileError);
        setReport([]);
        return;
      }

      // Consulta paginada: conta leads por etapa para um funil específico (evita corte em 1000)
      const PAGE_SIZE = 1000;
      let all: { kanban_stage_id: string }[] = [];
      
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase
          .from("leads")
          .select("kanban_stage_id")
          .eq("funnel_id", funnelId)
          .eq("created_by_user_id", userProfile.id)  // 🔒 FILTRO MULTITENANT FORÇADO
          .range(offset, offset + PAGE_SIZE - 1);
          
        if (error) {
          console.error('[useFunnelDashboard] Error loading data:', error);
          break;
        }
        
        all = all.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
      }

      if (all.length) {
        // Conta por etapa manualmente
        const countByStage: Record<string, number> = {};
        all.forEach((row: { kanban_stage_id: string }) => {
          if (row.kanban_stage_id)
            countByStage[row.kanban_stage_id] = (countByStage[row.kanban_stage_id] || 0) + 1;
        });
        const reportArr = Object.entries(countByStage).map(([kanban_stage_id, count]) => ({
          kanban_stage_id,
          count
        }));
        setReport(reportArr);
      } else {
        setReport([]);
      }
    } catch (error) {
      console.error('[useFunnelDashboard] Unexpected error:', error);
      setReport([]);
    } finally {
      setLoading(false);
    }
  }, [funnelId, user?.id]); // 🎯 Dependências corretas: funnelId + user.id

  useEffect(() => {
    loadReport();
  }, [loadReport]); // 🎯 Dependência correta: função memoizada

  return { report, loading, loadReport };
}
