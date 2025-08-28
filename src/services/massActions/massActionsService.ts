import { supabase } from "@/integrations/supabase/client";
import { KanbanLead } from "@/types/kanban";
import { toast } from "sonner";

export interface MassActionResult {
  success: boolean;
  message: string;
  affectedCount?: number;
}

export interface FunnelOption {
  id: string;
  name: string;
}

export interface StageOption {
  id: string;
  title: string;
  funnel_id: string;
}

export interface TagOption {
  id: string;
  name: string;
  color: string;
}

export interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Serviço isolado para operações em massa
 * Todas as funções são independentes e modulares
 */
export class MassActionsService {
  
  /**
   * Buscar todos os funis disponíveis
   */
  static async getFunnels(): Promise<FunnelOption[]> {
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      throw new Error('Erro ao carregar funis disponíveis');
    }
  }

  /**
   * Buscar etapas de um funil específico
   */
  static async getStagesByFunnel(funnelId: string): Promise<StageOption[]> {
    if (!funnelId) return [];

    try {
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('id, title, funnel_id')
        .eq('funnel_id', funnelId)
        .eq('is_won', false)
        .eq('is_lost', false)
        .order('order_position');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      throw new Error('Erro ao carregar etapas do funil');
    }
  }

  /**
   * Buscar todas as tags disponíveis
   */
  static async getTags(): Promise<TagOption[]> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      throw new Error('Erro ao carregar tags disponíveis');
    }
  }

  /**
   * Buscar todos os usuários da equipe
   */
  static async getUsers(): Promise<UserOption[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      throw new Error('Erro ao carregar usuários da equipe');
    }
  }

  /**
   * Excluir leads em massa
   */
  static async deleteLeads(leadIds: string[]): Promise<MassActionResult> {
    if (!leadIds.length) {
      return { success: false, message: 'Nenhum lead selecionado' };
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (error) throw error;

      return {
        success: true,
        message: `${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} excluído${leadIds.length > 1 ? 's' : ''} com sucesso!`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('Erro ao excluir leads:', error);
      return {
        success: false,
        message: 'Erro ao excluir leads. Tente novamente.'
      };
    }
  }

  /**
   * Mover leads para nova etapa/funil
   */
  static async moveLeads(
    leadIds: string[], 
    newStageId: string, 
    newFunnelId: string
  ): Promise<MassActionResult> {
    console.log('[MassActionsService] 📦 moveLeads chamado:', {
      leadIds: leadIds?.length || 0,
      leadIdsData: leadIds,
      newStageId,
      newFunnelId
    });
    
    if (!leadIds.length || !newStageId || !newFunnelId) {
      const errorMessage = 'Parâmetros inválidos para movimentação';
      console.error('[MassActionsService] ⚠️ Validação falhou:', {
        leadIdsLength: leadIds?.length || 0,
        hasNewStageId: !!newStageId,
        hasNewFunnelId: !!newFunnelId
      });
      return { success: false, message: errorMessage };
    }

    try {
      console.log('[MassActionsService] 📋 Executando update no Supabase...');
      
      const { error, count } = await supabase
        .from('leads')
        .update({ 
          kanban_stage_id: newStageId,
          funnel_id: newFunnelId 
        })
        .in('id', leadIds);

      console.log('[MassActionsService] ✅ Update executado:', {
        error: !!error,
        errorMessage: error?.message,
        count
      });

      if (error) throw error;

      const successMessage = `${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} movido${leadIds.length > 1 ? 's' : ''} com sucesso!`;
      console.log('[MassActionsService] ✅ Sucesso:', successMessage);
      
      return {
        success: true,
        message: successMessage,
        affectedCount: leadIds.length
      };
    } catch (error) {
      const errorMessage = 'Erro ao mover leads. Tente novamente.';
      console.error('[MassActionsService] ❌ Erro ao mover leads:', {
        error,
        message: error?.message,
        leadIds,
        newStageId,
        newFunnelId
      });
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Adicionar tags aos leads
   */
  static async addTagsToLeads(leadIds: string[], tagIds: string[]): Promise<MassActionResult> {
    if (!leadIds.length || !tagIds.length) {
      return { success: false, message: 'Nenhum lead ou tag selecionada' };
    }

    try {
      // Criar todas as combinações lead-tag
      const leadTagInserts = [];
      for (const leadId of leadIds) {
        for (const tagId of tagIds) {
          leadTagInserts.push({
            lead_id: leadId,
            tag_id: tagId,
            created_by_user_id: (await supabase.auth.getUser()).data.user?.id || ''
          });
        }
      }

      const { error } = await supabase
        .from('lead_tags')
        .upsert(leadTagInserts, { 
          onConflict: 'lead_id,tag_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      return {
        success: true,
        message: `${tagIds.length} tag${tagIds.length > 1 ? 's' : ''} adicionada${tagIds.length > 1 ? 's' : ''} a ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}!`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('Erro ao adicionar tags:', error);
      return {
        success: false,
        message: 'Erro ao adicionar tags. Tente novamente.'
      };
    }
  }

  /**
   * Remover tags dos leads
   */
  static async removeTagsFromLeads(leadIds: string[], tagIds: string[]): Promise<MassActionResult> {
    if (!leadIds.length || !tagIds.length) {
      return { success: false, message: 'Nenhum lead ou tag selecionada' };
    }

    try {
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .in('lead_id', leadIds)
        .in('tag_id', tagIds);

      if (error) throw error;

      return {
        success: true,
        message: `${tagIds.length} tag${tagIds.length > 1 ? 's' : ''} removida${tagIds.length > 1 ? 's' : ''} de ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}!`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('Erro ao remover tags:', error);
      return {
        success: false,
        message: 'Erro ao remover tags. Tente novamente.'
      };
    }
  }

  /**
   * Atribuir responsável aos leads
   */
  static async assignUserToLeads(leadIds: string[], userId: string): Promise<MassActionResult> {
    if (!leadIds.length || !userId) {
      return { success: false, message: 'Parâmetros inválidos para atribuição' };
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ owner_id: userId })
        .in('id', leadIds);

      if (error) throw error;

      return {
        success: true,
        message: `${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} atribuído${leadIds.length > 1 ? 's' : ''} com sucesso!`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      return {
        success: false,
        message: 'Erro ao atribuir responsável. Tente novamente.'
      };
    }
  }
}