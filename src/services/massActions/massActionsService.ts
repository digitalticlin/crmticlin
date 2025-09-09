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
   * Buscar funis disponíveis - FILTRO MULTITENANT APLICADO
   */
  static async getFunnels(): Promise<FunnelOption[]> {
    try {
      // 🔒 APLICAR FILTRO MULTITENANT - Buscar apenas funis do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] 🔒 Aplicando filtro multitenant para funis:', user.id);

      const { data, error } = await supabase
        .from('funnels')
        .select('id, name, created_by_user_id')
        .eq('created_by_user_id', user.id)  // 🔒 FILTRO MULTITENANT OBRIGATÓRIO
        .order('name');

      if (error) throw error;
      
      console.log('[MassActionsService] ✅ Funis carregados com filtro multitenant:', {
        userId: user.id,
        funnelsCount: data?.length || 0
      });
      
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
      throw new Error('Erro ao carregar funis disponíveis');
    }
  }

  /**
   * Buscar etapas de um funil específico - FILTRO MULTITENANT APLICADO
   */
  static async getStagesByFunnel(funnelId: string): Promise<StageOption[]> {
    if (!funnelId) return [];

    try {
      // 🔒 APLICAR FILTRO MULTITENANT - Verificar se o funil pertence ao usuário
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] 🔒 Aplicando filtro multitenant para etapas:', {
        funnelId,
        userId: user.id
      });

      const { data, error } = await supabase
        .from('kanban_stages')
        .select('id, title, funnel_id, created_by_user_id')
        .eq('funnel_id', funnelId)
        .eq('created_by_user_id', user.id)  // 🔒 FILTRO MULTITENANT OBRIGATÓRIO
        .eq('is_won', false)
        .eq('is_lost', false)
        .order('order_position');

      if (error) throw error;
      
      console.log('[MassActionsService] ✅ Etapas carregadas com filtro multitenant:', {
        funnelId,
        userId: user.id,
        stagesCount: data?.length || 0
      });
      
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      throw new Error('Erro ao carregar etapas do funil');
    }
  }

  /**
   * Buscar tags disponíveis - FILTRO MULTITENANT APLICADO
   */
  static async getTags(): Promise<TagOption[]> {
    try {
      // 🔒 APLICAR FILTRO MULTITENANT - Buscar apenas tags do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] 🔒 Aplicando filtro multitenant para tags:', user.id);

      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color, created_by_user_id')
        .eq('created_by_user_id', user.id)  // 🔒 FILTRO MULTITENANT OBRIGATÓRIO
        .order('name');

      if (error) throw error;
      
      console.log('[MassActionsService] ✅ Tags carregadas com filtro multitenant:', {
        userId: user.id,
        tagsCount: data?.length || 0
      });
      
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
   * Adicionar tags a leads em massa - ISOLADO
   */
  static async addTagsToLeads(leadIds: string[], tagIds: string[]): Promise<MassActionResult> {
    if (!leadIds.length || !tagIds.length) {
      return { success: false, message: 'IDs de leads ou tags inválidos' };
    }

    try {
      // 🔒 APLICAR FILTRO MULTITENANT
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] ➕ Adicionando tags em massa:', {
        leadIds: leadIds.length,
        tagIds: tagIds.length,
        userId: user.id
      });

      // Verificar se as tags pertencem ao usuário
      const { data: userTags, error: tagsError } = await supabase
        .from('tags')
        .select('id')
        .in('id', tagIds)
        .eq('created_by_user_id', user.id);

      if (tagsError) throw tagsError;

      const validTagIds = userTags?.map(t => t.id) || [];
      if (validTagIds.length !== tagIds.length) {
        return { 
          success: false, 
          message: 'Algumas tags não foram encontradas ou não pertencem ao usuário' 
        };
      }

      // Criar associações lead-tag em massa
      const leadTagAssociations = [];
      for (const leadId of leadIds) {
        for (const tagId of validTagIds) {
          leadTagAssociations.push({
            lead_id: leadId,
            tag_id: tagId
          });
        }
      }

      const { error: insertError } = await supabase
        .from('lead_tags')
        .upsert(leadTagAssociations, { 
          onConflict: 'lead_id,tag_id',
          ignoreDuplicates: true 
        });

      if (insertError) throw insertError;

      return {
        success: true,
        message: `Tags adicionadas com sucesso!`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('Erro ao adicionar tags:', error);
      return {
        success: false,
        message: 'Erro ao adicionar tags aos leads'
      };
    }
  }

  /**
   * Remover tags de leads em massa - ISOLADO
   */
  static async removeTagsFromLeads(leadIds: string[], tagIds: string[]): Promise<MassActionResult> {
    if (!leadIds.length || !tagIds.length) {
      return { success: false, message: 'IDs de leads ou tags inválidos' };
    }

    try {
      // 🔒 APLICAR FILTRO MULTITENANT
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] ➖ Removendo tags em massa:', {
        leadIds: leadIds.length,
        tagIds: tagIds.length,
        userId: user.id
      });

      // Remover associações lead-tag
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .in('lead_id', leadIds)
        .in('tag_id', tagIds);

      if (error) throw error;

      return {
        success: true,
        message: `Tags removidas com sucesso!`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('Erro ao remover tags:', error);
      return {
        success: false,
        message: 'Erro ao remover tags dos leads'
      };
    }
  }

  /**
   * Excluir leads em massa - INCLUINDO TODAS AS MENSAGENS E MÍDIAS
   */
  static async deleteLeads(leadIds: string[]): Promise<MassActionResult> {
    if (!leadIds.length) {
      return { success: false, message: 'Nenhum lead selecionado' };
    }

    try {
      // 🔒 APLICAR FILTRO MULTITENANT
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] 🗑️ Iniciando exclusão completa de leads:', {
        leadIds: leadIds.length,
        userId: user.id
      });

      // Primeiro, buscar IDs das mensagens que serão excluídas (para excluir media_cache relacionado)
      const { data: messagesToDelete, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .in('lead_id', leadIds)
        .eq('created_by_user_id', user.id); // 🔒 FILTRO MULTITENANT

      if (messagesError) {
        console.warn('[MassActionsService] ⚠️ Erro ao buscar mensagens:', messagesError);
        // Continuar mesmo se não conseguir buscar mensagens
      }

      const messageIds = messagesToDelete?.map(m => m.id) || [];
      console.log('[MassActionsService] 📝 Mensagens encontradas para exclusão:', messageIds.length);

      // 1. Excluir cache de mídia das mensagens (se houver)
      if (messageIds.length > 0) {
        const { error: mediaCacheError } = await supabase
          .from('media_cache')
          .delete()
          .in('message_id', messageIds);

        if (mediaCacheError) {
          console.warn('[MassActionsService] ⚠️ Erro ao excluir cache de mídia:', mediaCacheError);
          // Continuar mesmo se não conseguir excluir o cache
        } else {
          console.log('[MassActionsService] ✅ Cache de mídia excluído');
        }
      }

      // 2. Excluir mensagens relacionadas aos leads
      const { error: messagesDeleteError } = await supabase
        .from('messages')
        .delete()
        .in('lead_id', leadIds)
        .eq('created_by_user_id', user.id); // 🔒 FILTRO MULTITENANT

      if (messagesDeleteError) {
        console.warn('[MassActionsService] ⚠️ Erro ao excluir mensagens:', messagesDeleteError);
        // Continuar mesmo se não conseguir excluir mensagens
      } else {
        console.log('[MassActionsService] ✅ Mensagens excluídas:', messageIds.length);
      }

      // 3. Excluir os leads (apenas os que pertencem ao usuário)
      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds)
        .eq('created_by_user_id', user.id); // 🔒 FILTRO MULTITENANT OBRIGATÓRIO

      if (leadsError) throw leadsError;

      console.log('[MassActionsService] ✅ Exclusão completa realizada:', {
        leads: leadIds.length,
        messages: messageIds.length
      });

      return {
        success: true,
        message: `${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} excluído${leadIds.length > 1 ? 's' : ''} com sucesso! ${messageIds.length > 0 ? `Incluindo ${messageIds.length} mensagem${messageIds.length > 1 ? 's' : ''}.` : ''}`,
        affectedCount: leadIds.length
      };
    } catch (error) {
      console.error('[MassActionsService] ❌ Erro ao excluir leads:', error);
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
      // 🔒 APLICAR FILTRO MULTITENANT
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('[MassActionsService] 👤 Atribuindo responsável em massa:', {
        leadIds: leadIds.length,
        newOwner: userId,
        currentUser: user.id
      });

      // Atualizar apenas leads que pertencem ao usuário atual (filtro multitenant)
      const { error, count } = await supabase
        .from('leads')
        .update({ owner_id: userId })
        .in('id', leadIds)
        .eq('created_by_user_id', user.id);  // 🔒 FILTRO MULTITENANT OBRIGATÓRIO

      if (error) throw error;

      console.log('[MassActionsService] ✅ Responsável atribuído:', {
        affectedCount: count,
        requestedCount: leadIds.length
      });

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