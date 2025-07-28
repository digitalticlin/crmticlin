
/**
 * 🚀 HOOK REALTIME ESPECIALIZADO PARA SALES FUNNEL
 * 
 * Responsabilidades:
 * - Monitorar mudanças em leads, funnels e kanban_stages
 * - Sincronizar com WhatsApp Chat
 * - Otimizar performance com callbacks granulares
 * - Feedback visual instantâneo
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KanbanLead } from '@/types/kanban';
import { KanbanStage } from '@/types/funnel';
import { Funnel } from '@/types/funnel';

interface SalesFunnelRealtimeConfig {
  userId: string | null;
  selectedFunnelId: string | null;
  onLeadUpdate?: (lead: KanbanLead) => void;
  onNewLead?: (lead: KanbanLead) => void;
  onStageUpdate?: (stage: KanbanStage) => void;
  onFunnelUpdate?: (funnel: Funnel) => void;
  onDataRefresh?: () => void;
  onUnreadCountUpdate?: (leadId: string, newCount: number) => void;
  onLeadMove?: (leadId: string, newStageId: string) => void;
}

export const useSalesFunnelRealtime = ({
  userId,
  selectedFunnelId,
  onLeadUpdate,
  onNewLead,
  onStageUpdate,
  onFunnelUpdate,
  onDataRefresh,
  onUnreadCountUpdate,
  onLeadMove
}: SalesFunnelRealtimeConfig) => {
  
  const channelRef = useRef<any>(null);
  const isConnectedRef = useRef(false);
  const statsRef = useRef({
    totalEvents: 0,
    lastUpdate: null as number | null,
    connectionStatus: 'disconnected' as 'connected' | 'connecting' | 'disconnected' | 'error'
  });

  // 🧹 CLEANUP OTIMIZADO
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('[Sales Funnel Realtime] 🧹 Limpando canal realtime');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isConnectedRef.current = false;
      statsRef.current.connectionStatus = 'disconnected';
    }
  }, []);

  // 📊 HANDLER PARA LEADS
  const handleLeadsChange = useCallback((payload: any) => {
    const { eventType, new: newData, old: oldData } = payload;
    
    console.log('[Sales Funnel Realtime] 📊 Lead change:', {
      eventType,
      leadId: newData?.id || oldData?.id,
      leadName: newData?.name || oldData?.name,
      funnelId: newData?.funnel_id || oldData?.funnel_id
    });

    // Filtrar apenas leads do funil selecionado
    if (selectedFunnelId && (newData?.funnel_id !== selectedFunnelId && oldData?.funnel_id !== selectedFunnelId)) {
      return;
    }

    statsRef.current.totalEvents++;
    statsRef.current.lastUpdate = Date.now();

    // Processar diferentes tipos de eventos
    switch (eventType) {
      case 'INSERT':
        if (newData && onNewLead) {
          const lead: KanbanLead = {
            id: newData.id,
            name: newData.name,
            phone: newData.phone,
            email: newData.email,
            company: newData.company,
            lastMessage: newData.last_message || "Novo lead",
            lastMessageTime: newData.last_message_time || new Date().toISOString(),
            tags: [],
            notes: newData.notes,
            columnId: newData.kanban_stage_id,
            purchaseValue: newData.purchase_value ? Number(newData.purchase_value) : undefined,
            assignedUser: newData.owner_id,
            unreadCount: newData.unread_count || 0,
            avatar: undefined,
            created_at: newData.created_at,
            updated_at: newData.updated_at,
            company_id: newData.company_id,
            whatsapp_number_id: newData.whatsapp_number_id,
            funnel_id: newData.funnel_id,
            kanban_stage_id: newData.kanban_stage_id,
            owner_id: newData.owner_id
          };

          onNewLead(lead);
          toast.success(`Novo lead: ${newData.name}`, {
            description: "Lead adicionado ao funil"
          });
        }
        break;

      case 'UPDATE':
        if (newData && oldData) {
          // Verificar mudanças específicas
          const stageChanged = newData.kanban_stage_id !== oldData.kanban_stage_id;
          const unreadChanged = newData.unread_count !== oldData.unread_count;
          const valueChanged = newData.purchase_value !== oldData.purchase_value;
          const notesChanged = newData.notes !== oldData.notes;

          // Notificar mudança de estágio
          if (stageChanged && onLeadMove) {
            onLeadMove(newData.id, newData.kanban_stage_id);
            toast.info(`${newData.name} movido para nova etapa`);
          }

          // Notificar mudança de contador não lido
          if (unreadChanged && onUnreadCountUpdate) {
            onUnreadCountUpdate(newData.id, newData.unread_count || 0);
          }

          // Notificar atualização geral
          if (onLeadUpdate) {
            const updatedLead: KanbanLead = {
              id: newData.id,
              name: newData.name,
              phone: newData.phone,
              email: newData.email,
              company: newData.company,
              lastMessage: newData.last_message || oldData.last_message,
              lastMessageTime: newData.last_message_time || oldData.last_message_time,
              tags: [],
              notes: newData.notes,
              columnId: newData.kanban_stage_id,
              purchaseValue: newData.purchase_value ? Number(newData.purchase_value) : undefined,
              assignedUser: newData.owner_id,
              unreadCount: newData.unread_count || 0,
              avatar: undefined,
              created_at: newData.created_at,
              updated_at: newData.updated_at,
              company_id: newData.company_id,
              whatsapp_number_id: newData.whatsapp_number_id,
              funnel_id: newData.funnel_id,
              kanban_stage_id: newData.kanban_stage_id,
              owner_id: newData.owner_id
            };

            onLeadUpdate(updatedLead);
          }

          // Toast para mudanças importantes
          if (valueChanged) {
            toast.info(`Valor atualizado para ${newData.name}`);
          }
          if (notesChanged) {
            toast.info(`Notas atualizadas para ${newData.name}`);
          }
        }
        break;

      case 'DELETE':
        if (oldData) {
          toast.error(`Lead removido: ${oldData.name}`);
          // Forçar refresh para remover da UI
          if (onDataRefresh) {
            onDataRefresh();
          }
        }
        break;
    }
  }, [selectedFunnelId, onNewLead, onLeadUpdate, onLeadMove, onUnreadCountUpdate, onDataRefresh]);

  // 🏗️ HANDLER PARA STAGES
  const handleStagesChange = useCallback((payload: any) => {
    const { eventType, new: newData, old: oldData } = payload;
    
    console.log('[Sales Funnel Realtime] 🏗️ Stage change:', {
      eventType,
      stageId: newData?.id || oldData?.id,
      stageTitle: newData?.title || oldData?.title,
      funnelId: newData?.funnel_id || oldData?.funnel_id
    });

    // Filtrar apenas stages do funil selecionado
    if (selectedFunnelId && (newData?.funnel_id !== selectedFunnelId && oldData?.funnel_id !== selectedFunnelId)) {
      return;
    }

    statsRef.current.totalEvents++;
    statsRef.current.lastUpdate = Date.now();

    // Processar mudanças de stage
    switch (eventType) {
      case 'INSERT':
        if (newData) {
          toast.success(`Nova etapa criada: ${newData.title}`);
        }
        break;

      case 'UPDATE':
        if (newData && oldData) {
          if (newData.title !== oldData.title) {
            toast.info(`Etapa renomeada: ${oldData.title} → ${newData.title}`);
          }
        }
        break;

      case 'DELETE':
        if (oldData) {
          toast.error(`Etapa removida: ${oldData.title}`);
        }
        break;
    }

    // Sempre forçar refresh para mudanças de stage
    if (onDataRefresh) {
      onDataRefresh();
    }
  }, [selectedFunnelId, onStageUpdate, onDataRefresh]);

  // 📁 HANDLER PARA FUNNELS
  const handleFunnelsChange = useCallback((payload: any) => {
    const { eventType, new: newData, old: oldData } = payload;
    
    console.log('[Sales Funnel Realtime] 📁 Funnel change:', {
      eventType,
      funnelId: newData?.id || oldData?.id,
      funnelName: newData?.name || oldData?.name
    });

    statsRef.current.totalEvents++;
    statsRef.current.lastUpdate = Date.now();

    // Processar mudanças de funnel
    switch (eventType) {
      case 'INSERT':
        if (newData) {
          toast.success(`Novo funil criado: ${newData.name}`);
        }
        break;

      case 'UPDATE':
        if (newData && oldData) {
          if (newData.name !== oldData.name) {
            toast.info(`Funil renomeado: ${oldData.name} → ${newData.name}`);
          }
        }
        break;

      case 'DELETE':
        if (oldData) {
          toast.error(`Funil removido: ${oldData.name}`);
        }
        break;
    }

    // Sempre forçar refresh para mudanças de funnel
    if (onDataRefresh) {
      onDataRefresh();
    }
  }, [onFunnelUpdate, onDataRefresh]);

  // 🚀 CONFIGURAR REALTIME
  useEffect(() => {
    // Validar parâmetros necessários
    if (!userId || !selectedFunnelId) {
      console.log('[Sales Funnel Realtime] ⚠️ Aguardando userId e selectedFunnelId');
      cleanup();
      return;
    }

    // Verificar se há pelo menos um callback
    const hasCallbacks = !!(onLeadUpdate || onNewLead || onStageUpdate || onFunnelUpdate || onDataRefresh || onUnreadCountUpdate || onLeadMove);
    if (!hasCallbacks) {
      console.log('[Sales Funnel Realtime] ⚠️ Nenhum callback configurado');
      cleanup();
      return;
    }

    console.log('[Sales Funnel Realtime] 🚀 Configurando realtime para:', {
      userId,
      selectedFunnelId,
      hasCallbacks
    });

    // Cleanup anterior
    cleanup();

    // Criar canal
    const channelId = `sales-funnel-${userId}-${selectedFunnelId}-${Date.now()}`;
    statsRef.current.connectionStatus = 'connecting';

    const channel = supabase
      .channel(channelId)
      
      // 📊 SUBSCRIPTION PARA LEADS
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `funnel_id=eq.${selectedFunnelId}`
      }, handleLeadsChange)
      
      // 🏗️ SUBSCRIPTION PARA STAGES
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kanban_stages',
        filter: `funnel_id=eq.${selectedFunnelId}`
      }, handleStagesChange)
      
      // 📁 SUBSCRIPTION PARA FUNNELS
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'funnels',
        filter: `id=eq.${selectedFunnelId}`
      }, handleFunnelsChange)
      
      .subscribe((status) => {
        console.log('[Sales Funnel Realtime] 📡 Status da conexão:', status);
        
        if (status === 'SUBSCRIBED') {
          isConnectedRef.current = true;
          statsRef.current.connectionStatus = 'connected';
          toast.success('Sincronização ativada', {
            description: 'Funil de vendas em tempo real'
          });
        } else if (status === 'CHANNEL_ERROR') {
          isConnectedRef.current = false;
          statsRef.current.connectionStatus = 'error';
          toast.error('Erro na sincronização');
        } else if (status === 'CLOSED') {
          isConnectedRef.current = false;
          statsRef.current.connectionStatus = 'disconnected';
        }
      });

    channelRef.current = channel;

    return cleanup;
  }, [userId, selectedFunnelId, handleLeadsChange, handleStagesChange, handleFunnelsChange, cleanup]);

  // 🧹 CLEANUP GERAL
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 📊 RETORNAR ESTATÍSTICAS
  return {
    isConnected: isConnectedRef.current,
    connectionStatus: statsRef.current.connectionStatus,
    totalEvents: statsRef.current.totalEvents,
    lastUpdate: statsRef.current.lastUpdate,
    forceDisconnect: cleanup
  };
};
