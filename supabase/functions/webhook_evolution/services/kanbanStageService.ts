
// deno-lint-ignore-file no-explicit-any
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function findOrCreateKanbanStageId(
  supabase: SupabaseClient,
  createdByUserId: string // CORREÇÃO: Receber created_by_user_id em vez de companyId
): Promise<string | null> {
  try {
    console.log(`Buscando estágio kanban para usuário: ${createdByUserId}`);
    
    // CORREÇÃO: Buscar estágio baseado em created_by_user_id
    let { data: stage, error: stageError } = await supabase
      .from('kanban_stages')
      .select('id')
      .eq('created_by_user_id', createdByUserId) // CORREÇÃO: Usar created_by_user_id
      .eq('title', 'Entrada de Leads')
      .maybeSingle();

    if (stageError && stageError.code !== 'PGRST116') {
      console.error("Erro ao buscar estágio kanban:", stageError);
      return null;
    }

    if (!stage) {
      console.log("Estágio 'Entrada de Leads' não encontrado, criando...");
      
      // CORREÇÃO: Buscar funil baseado em created_by_user_id
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('id')
        .eq('created_by_user_id', createdByUserId) // CORREÇÃO: Usar created_by_user_id
        .limit(1)
        .maybeSingle();

      if (funnelError) {
        console.error("Erro ao buscar funil:", funnelError);
        return null;
      }

      if (!funnel) {
        console.log("Nenhum funil encontrado para o usuário, criando funil padrão...");
        
        // CORREÇÃO: Criar funil baseado em created_by_user_id
        const { data: newFunnel, error: createFunnelError } = await supabase
          .from('funnels')
          .insert({
            name: 'Funil Principal',
            description: 'Funil padrão criado automaticamente',
            created_by_user_id: createdByUserId // CORREÇÃO: Usar created_by_user_id
          })
          .select('id')
          .single();

        if (createFunnelError) {
          console.error("Erro ao criar funil:", createFunnelError);
          return null;
        }

        // CORREÇÃO: Criar estágio baseado em created_by_user_id
        const { data: newStage, error: createStageError } = await supabase
          .from('kanban_stages')
          .insert({
            title: 'Entrada de Leads',
            color: '#3b82f6',
            order_position: 1,
            funnel_id: newFunnel.id,
            created_by_user_id: createdByUserId // CORREÇÃO: Usar created_by_user_id
          })
          .select('id')
          .single();

        if (createStageError) {
          console.error("Erro ao criar estágio:", createStageError);
          return null;
        }

        return newStage.id;
      } else {
        // CORREÇÃO: Criar estágio baseado em created_by_user_id
        const { data: newStage, error: createStageError } = await supabase
          .from('kanban_stages')
          .insert({
            title: 'Entrada de Leads',
            color: '#3b82f6',
            order_position: 1,
            funnel_id: funnel.id,
            created_by_user_id: createdByUserId // CORREÇÃO: Usar created_by_user_id
          })
          .select('id')
          .single();

        if (createStageError) {
          console.error("Erro ao criar estágio:", createStageError);
          return null;
        }

        return newStage.id;
      }
    }

    console.log(`Estágio encontrado: ${stage.id}`);
    return stage.id;
  } catch (error) {
    console.error("Erro ao buscar/criar estágio kanban:", error);
    return null;
  }
}
