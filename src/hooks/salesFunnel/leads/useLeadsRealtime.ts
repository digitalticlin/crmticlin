/**
 * 🎯 HOOK ISOLADO - REAL-TIME PARA LEADS
 *
 * RESPONSABILIDADES:
 * ✅ Escutar mudanças em leads via websocket
 * ✅ Atualizar cache do useFunnelLeads automaticamente
 * ✅ Pausar durante drag & drop para não travar
 * ✅ Debounce inteligente para performance
 * ✅ Adicionar novos leads na primeira etapa (Entrada de Leads)
 *
 * NÃO FAZ:
 * ❌ Mover cards ao topo quando chega mensagem (REMOVIDO)
 * ❌ Recarregar página inteira
 * ❌ Fazer queries (isso é no useFunnelLeads)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { KanbanLead } from '@/types/kanban';
import { funnelLeadsQueryKeys } from './useFunnelLeads';
import { funnelLeadsFilteredQueryKeys } from './useFunnelLeadsFiltered';

interface UseLeadsRealtimeParams {
  funnelId: string | null;
  firstStageId?: string; // Para novos leads irem para "Entrada"
  enabled?: boolean;
  onNewLead?: (lead: KanbanLead) => void; // Callback opcional
}

export function useLeadsRealtime({
  funnelId,
  firstStageId,
  enabled = true,
  onNewLead
}: UseLeadsRealtimeParams) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isPausedRef = useRef(false);

  // 🚀 BUSCAR ADMIN ID PARA OPERATIONAL (mesma lógica do useFunnelLeads)
  const getLeadsOwnerId = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;

    if (role === 'admin') {
      return user.id; // Admin vê seus próprios leads
    }

    if (role === 'operational') {
      // Buscar quem é o admin do operational
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('created_by_user_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[useLeadsRealtime] Erro ao buscar admin do operational:', error);
        return null;
      }

      return profile?.created_by_user_id || null; // Retorna ID do admin
    }

    return null;
  }, [user?.id, role]);

  // Debounce para evitar updates excessivos
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Função para verificar se está dragging
  const isDragging = useCallback(() => {
    return document.body.hasAttribute('data-dragging') || isPausedRef.current;
  }, []);

  // Função para pausar real-time (usada durante drag)
  const pauseRealtime = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // Função para retomar real-time
  const resumeRealtime = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  // Função para atualizar lead no cache com debounce
  const debouncedUpdateLead = useCallback((leadId: string, leadData: any) => {
    if (isDragging()) {
      return;
    }

    const key = `update_${leadId}`;
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      if (!isDragging()) {
        // 🚀 FASE 3: INVALIDAÇÃO SUPER INTELIGENTE - apenas queries específicas do funil
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            const keyStr = key[0] as string;
            const funnelInQuery = key.includes(funnelId);

            return keyStr && funnelInQuery && (
              keyStr.includes('salesfunnel-leads') ||
              keyStr.includes('salesfunnel-leads-filtered') ||
              keyStr.includes('funnel-leads-infinite')
            );
          }
        });
      }
      debounceTimers.current.delete(key);
    }, 150); // 🚀 FASE 3: Reduzido de 300ms → 150ms para sync mais rápida

    debounceTimers.current.set(key, timer);
  }, [funnelId, user?.id, queryClient, isDragging]);

  // Função para adicionar novo lead
  const addNewLeadToCache = useCallback(async (leadData: any) => {
    if (isDragging()) {
      return;
    }

    try {
      // Buscar as tags do lead recém-criado
      const { data: leadWithTags } = await supabase
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
        .eq('id', leadData.id)
        .single();

      const formattedLead: KanbanLead = {
        id: leadWithTags.id,
        name: leadWithTags.name,
        phone: leadWithTags.phone,
        email: leadWithTags.email,
        company: leadWithTags.company,
        notes: leadWithTags.notes,
        lastMessage: leadWithTags.last_message || 'Sem mensagens',
        lastMessageTime: leadWithTags.last_message_time || new Date().toISOString(),
        purchaseValue: leadWithTags.purchase_value,
        purchase_value: leadWithTags.purchase_value,
        unreadCount: leadWithTags.unread_count || 0,
        unread_count: leadWithTags.unread_count || 0,
        assignedUser: leadWithTags.owner_id,
        owner_id: leadWithTags.owner_id,
        created_by_user_id: leadWithTags.created_by_user_id,
        columnId: leadWithTags.kanban_stage_id || firstStageId || '',
        kanban_stage_id: leadWithTags.kanban_stage_id,
        funnel_id: leadWithTags.funnel_id,
        created_at: leadWithTags.created_at,
        updated_at: leadWithTags.updated_at,
        profile_pic_url: leadWithTags.profile_pic_url,
        tags: leadWithTags.lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || []
      };

      // 🚀 FASE 3: INVALIDAÇÃO OTIMIZADA para novo lead
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          const keyStr = key[0] as string;
          const funnelInQuery = key.includes(funnelId);

          return keyStr && funnelInQuery && (
            keyStr.includes('salesfunnel-leads') ||
            keyStr.includes('salesfunnel-leads-filtered') ||
            keyStr.includes('funnel-leads-infinite')
          );
        }
      });

      // Callback opcional
      if (onNewLead) {
        onNewLead(formattedLead);
      }

    } catch (error) {
      console.error('[useLeadsRealtime] ❌ Erro ao buscar novo lead:', error);
    }
  }, [funnelId, firstStageId, user?.id, queryClient, onNewLead, isDragging]);

  // Configurar real-time
  useEffect(() => {
    if (!funnelId || !user?.id || !enabled) {
      return;
    }

    // Limpar canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelId = `leads_realtime_${funnelId}_${user.id}_${Date.now()}`;

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `funnel_id=eq.${funnelId}`
        },
        (payload) => {
          const leadData = payload.new;

          // 🚀 VERIFICAR SE É DO ADMIN CORRETO (segurança multi-tenant)
          getLeadsOwnerId().then(leadsOwnerId => {
            if (leadData.created_by_user_id === leadsOwnerId) {
              addNewLeadToCache(leadData);
            } else {
              console.log('[useLeadsRealtime] 🚫 Lead ignorado - não pertence ao admin correto:', {
                leadCreatedBy: leadData.created_by_user_id,
                expectedOwnerId: leadsOwnerId
              });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `funnel_id=eq.${funnelId}`
        },
        (payload) => {
          const leadData = payload.new;

          // 🚀 VERIFICAR SE É DO ADMIN CORRETO (segurança multi-tenant)
          getLeadsOwnerId().then(leadsOwnerId => {
            if (leadData.created_by_user_id === leadsOwnerId) {
              // Só atualizar dados, NÃO mover ao topo
              debouncedUpdateLead(leadData.id, {
              name: leadData.name,
              phone: leadData.phone,
              email: leadData.email,
              company: leadData.company,
              notes: leadData.notes,
              lastMessage: leadData.last_message,
              lastMessageTime: leadData.last_message_time,
              purchaseValue: leadData.purchase_value,
              purchase_value: leadData.purchase_value,
              unreadCount: leadData.unread_count,
              unread_count: leadData.unread_count,
              assignedUser: leadData.owner_id,
              owner_id: leadData.owner_id,
              columnId: leadData.kanban_stage_id,
              kanban_stage_id: leadData.kanban_stage_id,
              updated_at: leadData.updated_at,
              profile_pic_url: leadData.profile_pic_url
              });
            } else {
              console.log('[useLeadsRealtime] 🚫 Update ignorado - não pertence ao admin correto:', {
                leadCreatedBy: leadData.created_by_user_id,
                expectedOwnerId: leadsOwnerId
              });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'leads',
          filter: `funnel_id=eq.${funnelId}`
        },
        (payload) => {
          const leadData = payload.old;

          queryClient.setQueryData(
            funnelLeadsQueryKeys.byFunnel(funnelId, user.id),
            (oldData: KanbanLead[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.filter(lead => lead.id !== leadData.id);
            }
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Limpar timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, [funnelId, user?.id, enabled, addNewLeadToCache, debouncedUpdateLead, queryClient]);

  return {
    pauseRealtime,
    resumeRealtime,
    isPaused: isPausedRef.current
  };
}