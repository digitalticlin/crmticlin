/**
 * 🎯 HOOK ADAPTADOR - COMPATIBILIDADE COM CÓDIGO EXISTENTE
 *
 * ARQUITETURA REFATORADA:
 * ✅ Usa cache compartilhado do useFunnelData
 * ✅ Mantém interface existente do useFunnelDataManager
 * ✅ Adiciona funcionalidade de scroll infinito por stage
 * ✅ Realtime gerenciado pelo useFunnelData (apenas invalidação)
 *
 * RESPONSABILIDADES:
 * ✅ Adaptar dados do cache para formato KanbanColumn
 * ✅ Gerenciar scroll infinito por stage
 * ✅ Fornecer interface compatível com componentes existentes
 *
 * NÃO FAZ:
 * ❌ Query HTTP própria (useFunnelData faz isso)
 * ❌ Gerenciar realtime diretamente (useFunnelData faz isso)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanLead, KanbanColumn } from '@/types/kanban';
import { useFunnelData, funnelDataQueryKeys } from './core/useFunnelData';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface FunnelDataOptions {
  funnelId?: string | null;
  enabled?: boolean;
  pageSize?: number;
  realtime?: boolean;
}

interface FunnelDataReturn {
  columns: KanbanColumn[];
  allLeads: KanbanLead[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  refreshData: () => void;
  getStageLeads: (stageId: string) => KanbanLead[];
  loadMoreForStage: (stageId: string) => void;
  totalLeads: number;
  leadsPerStage: Record<string, number>;
}

/**
 * Hook adaptador que usa o cache compartilhado
 * Mantém interface compatível com código existente
 */
export const useFunnelDataManager = (options: FunnelDataOptions): FunnelDataReturn => {
  const {
    funnelId,
    enabled = true,
    pageSize = 20,
    realtime = true
  } = options;

  const { user } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();

  // ✅ USA CACHE COMPARTILHADO - não faz query própria
  const { data, isLoading, refetch } = useFunnelData({
    funnelId,
    enabled,
    realtime
  });

  // Estado para gerenciar paginação de stages
  const stageLoadingState = useRef<Map<string, { page: number; hasMore: boolean }>>(new Map());
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [allLeads, setAllLeads] = useState<KanbanLead[]>([]);

  // Processar dados do cache e organizar em colunas
  useEffect(() => {
    if (!data) return;

    const { stages, leadsByStage } = data;

    // Processar leads com formatação correta
    const processedLeadsByStage: Record<string, KanbanLead[]> = {};

    Object.entries(leadsByStage).forEach(([stageId, leads]) => {
      processedLeadsByStage[stageId] = leads.map((lead: any) => {
        // Extrair tags
        const tags = lead.lead_tags?.map((lt: any) => {
          if (lt.tags) {
            return {
              id: lt.tags.id,
              name: lt.tags.name,
              color: lt.tags.color
            };
          }
          return null;
        }).filter((tag: any) => tag !== null) || [];

        return {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company,
          notes: lead.notes,
          lastMessage: lead.last_message || 'Sem mensagens',
          lastMessageTime: lead.last_message_time || new Date().toISOString(),
          purchaseValue: lead.purchase_value,
          purchase_value: lead.purchase_value,
          unreadCount: lead.unread_count || 0,
          unread_count: lead.unread_count || 0,
          assignedUser: lead.owner_id,
          owner_id: lead.owner_id,
          created_by_user_id: lead.created_by_user_id,
          columnId: lead.kanban_stage_id || '',
          kanban_stage_id: lead.kanban_stage_id,
          funnel_id: lead.funnel_id,
          whatsapp_number_id: lead.whatsapp_number_id,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          profile_pic_url: lead.profile_pic_url,
          conversation_status: lead.conversation_status,
          tags,
          avatar: lead.profile_pic_url,
          last_message: lead.last_message,
          last_message_time: lead.last_message_time
        };
      });
    });

    // Criar colunas
    const newColumns: KanbanColumn[] = stages
      .filter((stage: any) => !stage.is_won && !stage.is_lost) // Apenas stages principais
      .map((stage: any) => ({
        id: stage.id,
        title: stage.title || stage.name || 'Sem nome',
        color: stage.color || '#6B7280',
        ai_enabled: stage.ai_enabled,
        leads: processedLeadsByStage[stage.id] || [],
        order_position: stage.order_position
      }));

    setColumns(newColumns);

    // Flatten all leads
    const flatLeads = Object.values(processedLeadsByStage).flat();
    setAllLeads(flatLeads);

    // Inicializar estado de paginação
    newColumns.forEach(column => {
      if (!stageLoadingState.current.has(column.id)) {
        stageLoadingState.current.set(column.id, {
          page: 1, // Já carregou primeira página
          hasMore: column.leads.length >= pageSize
        });
      }
    });

    console.log('[useFunnelDataManager] 📦 Dados organizados do cache:', {
      columns: newColumns.length,
      totalLeads: flatLeads.length
    });
  }, [data, pageSize]);

  // Carregar mais leads para stage específica
  const loadMoreForStage = useCallback(async (stageId: string) => {
    if (!funnelId || !data) return;

    const stageState = stageLoadingState.current.get(stageId) || { page: 0, hasMore: true };

    if (!stageState.hasMore) {
      console.log('[useFunnelDataManager] ⏹️ Sem mais leads para carregar:', stageId);
      return;
    }

    console.log('[useFunnelDataManager] 📜 Carregando mais leads:', {
      stageId,
      page: stageState.page,
      offset: stageState.page * pageSize
    });

    const leadsOwnerId = data.leadsOwnerId;

    try {
      const { data: moreLeads, error } = await supabase
        .from('leads')
        .select(`
          *,
          lead_tags (
            tag_id,
            tags (
              id,
              name,
              color
            )
          )
        `)
        .eq('kanban_stage_id', stageId)
        .eq('funnel_id', funnelId)
        .eq('created_by_user_id', leadsOwnerId)
        .order('created_at', { ascending: false })
        .range(stageState.page * pageSize, (stageState.page + 1) * pageSize - 1);

      if (error) throw error;

      // Atualizar estado de paginação
      stageLoadingState.current.set(stageId, {
        page: stageState.page + 1,
        hasMore: moreLeads.length === pageSize
      });

      // Processar novos leads
      const processedLeads: KanbanLead[] = moreLeads.map((lead: any) => {
        const tags = lead.lead_tags?.map((lt: any) => {
          if (lt.tags) {
            return {
              id: lt.tags.id,
              name: lt.tags.name,
              color: lt.tags.color
            };
          }
          return null;
        }).filter((tag: any) => tag !== null) || [];

        return {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company,
          notes: lead.notes,
          lastMessage: lead.last_message || 'Sem mensagens',
          lastMessageTime: lead.last_message_time || new Date().toISOString(),
          purchaseValue: lead.purchase_value,
          purchase_value: lead.purchase_value,
          unreadCount: lead.unread_count || 0,
          unread_count: lead.unread_count || 0,
          assignedUser: lead.owner_id,
          owner_id: lead.owner_id,
          created_by_user_id: lead.created_by_user_id,
          columnId: lead.kanban_stage_id || '',
          kanban_stage_id: lead.kanban_stage_id,
          funnel_id: lead.funnel_id,
          whatsapp_number_id: lead.whatsapp_number_id,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          profile_pic_url: lead.profile_pic_url,
          conversation_status: lead.conversation_status,
          tags,
          avatar: lead.profile_pic_url,
          last_message: lead.last_message,
          last_message_time: lead.last_message_time
        };
      });

      // Adicionar leads à coluna
      setColumns(prev => prev.map(column => {
        if (column.id === stageId) {
          return {
            ...column,
            leads: [...column.leads, ...processedLeads]
          };
        }
        return column;
      }));

      setAllLeads(prev => [...prev, ...processedLeads]);

      console.log('[useFunnelDataManager] ✅ Mais leads carregados:', {
        stageId,
        count: processedLeads.length
      });
    } catch (error) {
      console.error('[useFunnelDataManager] ❌ Erro ao carregar mais leads:', error);
    }
  }, [funnelId, data, pageSize]);

  // Obter leads de uma stage específica
  const getStageLeads = useCallback((stageId: string): KanbanLead[] => {
    const column = columns.find(col => col.id === stageId);
    return column?.leads || [];
  }, [columns]);

  // Refresh manual
  const refreshData = useCallback(() => {
    console.log('[useFunnelDataManager] 🔄 Refresh manual solicitado');
    refetch();
  }, [refetch]);

  // Scroll infinito geral (não usado nesta implementação)
  const loadMore = useCallback(() => {
    console.log('[useFunnelDataManager] 📜 LoadMore geral não implementado');
  }, []);

  // Calcular estatísticas
  const totalLeads = allLeads.length;
  const leadsPerStage = columns.reduce((acc, column) => {
    acc[column.id] = column.leads.length;
    return acc;
  }, {} as Record<string, number>);

  return {
    columns,
    allLeads,
    isLoading,
    isLoadingMore: false,
    hasNextPage: false,
    loadMore,
    refreshData,
    getStageLeads,
    loadMoreForStage,
    totalLeads,
    leadsPerStage
  };
};
