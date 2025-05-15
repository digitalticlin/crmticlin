
// deno-lint-ignore-file no-explicit-any
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function findOrCreateKanbanStageId(supabase: SupabaseClient, companyId: string): Promise<string | null> {
  // Buscar a etapa de entrada de leads no kanban
  const { data: entryStage, error: stageError } = await supabase
    .from('kanban_stages')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_fixed', true)
    .ilike('title', '%entrada%leads%')
    .maybeSingle();

  if (stageError && !entryStage) {
    console.log("Etapa de entrada não encontrada pelo nome, buscando o primeiro estágio...", stageError);
    const { data: firstStage, error: firstStageError } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('company_id', companyId)
      .order('order_position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!firstStageError && firstStage) {
      return firstStage.id;
    } else {
      console.error("Não foi possível encontrar nenhum estágio de kanban:", firstStageError || "Nenhum estágio encontrado.");
      return null;
    }
  } else if (entryStage) {
    return entryStage.id;
  }
  return null;
}
