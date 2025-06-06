
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyData } from '@/hooks/useCompanyData';
import { toast } from 'sonner';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

interface LeadSyncOptions {
  activeInstance: WhatsAppWebInstance | null;
  funnelId?: string;
  pollingInterval?: number;
  messagesLimit?: number;
}

export const useWhatsAppLeadSync = ({
  activeInstance,
  funnelId,
  pollingInterval = 30000, // 30 segundos
  messagesLimit = 30
}: LeadSyncOptions) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncedLeadsCount, setSyncedLeadsCount] = useState(0);
  const { companyId } = useCompanyData();

  // Função para buscar ou criar o estágio "ENTRADA DE LEADS"
  const getOrCreateEntryStage = useCallback(async (targetFunnelId: string) => {
    try {
      // Primeiro, tentar encontrar o estágio existente
      const { data: existingStage, error: fetchError } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('funnel_id', targetFunnelId)
        .ilike('title', '%entrada%lead%')
        .single();

      if (existingStage) {
        console.log('[Lead Sync] 🎯 Estágio "ENTRADA DE LEADS" encontrado:', existingStage.id);
        return existingStage.id;
      }

      // Se não encontrou, criar novo estágio
      const { data: newStage, error: createError } = await supabase
        .from('kanban_stages')
        .insert({
          title: 'ENTRADA DE LEADS',
          color: '#3b82f6',
          order_position: 0,
          funnel_id: targetFunnelId,
          company_id: companyId,
          created_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          is_fixed: false,
          is_won: false,
          is_lost: false
        })
        .select('id')
        .single();

      if (createError) throw createError;

      console.log('[Lead Sync] 🆕 Novo estágio "ENTRADA DE LEADS" criado:', newStage.id);
      return newStage.id;
    } catch (error) {
      console.error('[Lead Sync] ❌ Erro ao obter/criar estágio de entrada:', error);
      throw error;
    }
  }, [companyId]);

  // Função para sincronizar histórico de mensagens
  const syncChatHistory = useCallback(async (instanceId: string, leadId: string) => {
    try {
      console.log('[Lead Sync] 📚 Sincronizando histórico de mensagens:', { instanceId, leadId, limit: messagesLimit });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_chat_history',
          chatData: {
            instanceId,
            leadId,
            limit: messagesLimit,
            offset: 0
          }
        }
      });

      if (error) {
        console.error('[Lead Sync] ❌ Erro ao buscar histórico:', error);
        return 0;
      }

      if (data.success && data.data.messages) {
        console.log('[Lead Sync] ✅ Histórico sincronizado:', data.data.messages.length, 'mensagens');
        return data.data.messages.length;
      }

      return 0;
    } catch (error) {
      console.error('[Lead Sync] ❌ Erro na sincronização de histórico:', error);
      return 0;
    }
  }, [messagesLimit]);

  // Função principal de sincronização de leads
  const syncLeadsToFunnel = useCallback(async () => {
    if (!activeInstance || !funnelId || !companyId) {
      console.log('[Lead Sync] ⚠️ Pré-requisitos não atendidos:', { 
        hasInstance: !!activeInstance, 
        hasFunnel: !!funnelId, 
        hasCompany: !!companyId 
      });
      return;
    }

    setIsSyncing(true);
    try {
      console.log('[Lead Sync] 🔄 Iniciando sincronização de leads para o funil:', funnelId);

      // 1. Obter ou criar estágio de entrada
      const entryStageId = await getOrCreateEntryStage(funnelId);

      // 2. Buscar leads da instância WhatsApp que não estão no funil
      const { data: leadsToSync, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, phone, last_message, last_message_time')
        .eq('whatsapp_number_id', activeInstance.id)
        .eq('company_id', companyId)
        .is('kanban_stage_id', null); // Leads que não estão em nenhum estágio

      if (leadsError) throw leadsError;

      if (!leadsToSync || leadsToSync.length === 0) {
        console.log('[Lead Sync] ℹ️ Nenhum lead novo para sincronizar');
        setSyncedLeadsCount(0);
        return;
      }

      console.log('[Lead Sync] 📋 Leads encontrados para sincronizar:', leadsToSync.length);

      // 3. Atualizar leads para o estágio de entrada
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          kanban_stage_id: entryStageId,
          funnel_id: funnelId,
          updated_at: new Date().toISOString()
        })
        .in('id', leadsToSync.map(lead => lead.id));

      if (updateError) throw updateError;

      // 4. Sincronizar histórico de mensagens para cada lead
      let totalMessagesSynced = 0;
      for (const lead of leadsToSync) {
        const messageCount = await syncChatHistory(activeInstance.id, lead.id);
        totalMessagesSynced += messageCount;
      }

      setSyncedLeadsCount(leadsToSync.length);
      setLastSyncTime(new Date());

      console.log('[Lead Sync] ✅ Sincronização concluída:', {
        leadsSynced: leadsToSync.length,
        messagesSynced: totalMessagesSynced,
        entryStageId
      });

      toast.success(`${leadsToSync.length} leads sincronizados para o funil!`);

    } catch (error) {
      console.error('[Lead Sync] ❌ Erro na sincronização:', error);
      toast.error('Erro ao sincronizar leads para o funil');
    } finally {
      setIsSyncing(false);
    }
  }, [activeInstance, funnelId, companyId, getOrCreateEntryStage, syncChatHistory]);

  // Polling automático
  useEffect(() => {
    if (!activeInstance || !funnelId || activeInstance.connection_status !== 'connected') {
      return;
    }

    console.log('[Lead Sync] ⏰ Iniciando polling automático a cada', pollingInterval / 1000, 'segundos');

    // Sincronização inicial
    syncLeadsToFunnel();

    // Configurar polling
    const interval = setInterval(() => {
      console.log('[Lead Sync] 🔄 Executando sincronização automática...');
      syncLeadsToFunnel();
    }, pollingInterval);

    return () => {
      console.log('[Lead Sync] 🛑 Parando polling automático');
      clearInterval(interval);
    };
  }, [activeInstance, funnelId, pollingInterval, syncLeadsToFunnel]);

  // Função para sincronização manual
  const forceSyncLeads = useCallback(async () => {
    console.log('[Lead Sync] 🔄 Sincronização manual solicitada');
    await syncLeadsToFunnel();
  }, [syncLeadsToFunnel]);

  return {
    isSyncing,
    lastSyncTime,
    syncedLeadsCount,
    forceSyncLeads,
    isPollingActive: !!activeInstance && !!funnelId && activeInstance.connection_status === 'connected'
  };
};
