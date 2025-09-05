
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebInstance, WhatsAppConnectionStatus } from '@/types/whatsapp';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadInstances = useCallback(async () => {
    try {
      console.log('[WhatsApp Web Instances] 🔄 Carregando instâncias...');
      
      if (!user?.id) {
        console.log('[WhatsApp Web Instances] ⚠️ Usuário não autenticado');
        setInstances([]);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .eq('created_by_user_id', user.id) // 🔒 FILTRO MULTI-TENANT ADICIONADO
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WhatsApp Web Instances] ❌ Erro ao carregar:', error);
        throw error;
      }

      console.log(`[WhatsApp Web Instances] ✅ ${data?.length || 0} instâncias carregadas para usuário: ${user.email}`);
      
      // Converter os dados do banco para o tipo correto
      const typedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        ...instance,
        connection_status: instance.connection_status as WhatsAppConnectionStatus
      }));
      
      setInstances(typedInstances);
    } catch (error: any) {
      console.error('[WhatsApp Web Instances] ❌ Erro geral:', error);
      toast.error(`Erro ao carregar instâncias: ${error.message}`);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      console.log(`[WhatsApp Web Instances] 🗑️ Deletando instância VIA EDGE FUNCTION: ${instanceId}`);
      
      // Remover imediatamente da UI para feedback instantâneo
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
      
      // ✅ CORREÇÃO: Usar Edge Function para deleção completa (VPS + Banco)
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_delete', {
        body: { instanceId }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na deleção pela Edge Function');
      }

      console.log(`[WhatsApp Web Instances] ✅ Instância deletada via Edge Function: ${instanceId}`);
      console.log(`[WhatsApp Web Instances] 🎯 Detalhes:`, data.details);
      toast.success('Instância deletada completamente!');
      // NÃO recarregar - já foi removida otimisticamente e confirmada pela Edge
    } catch (error: any) {
      console.error(`[WhatsApp Web Instances] ❌ Erro ao deletar:`, error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
      // Recarregar apenas em caso de erro para restaurar estado
      await loadInstances();
    }
  }, [loadInstances]);

  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log(`[WhatsApp Web Instances] 🔄 Atualizando/gerando QR Code via Edge: ${instanceId}`);
      
      // Usar edge padronizada para solicitar/forçar geração do QR na VPS
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: { instanceId }
      });

      if (error) throw error;

      if (data?.success) {
        console.log(`[WhatsApp Web Instances] ✅ QR Code atualizado/obtido: ${instanceId}`);
        toast.success('QR Code atualizado!');
        await loadInstances();
        return data;
      }

      // Caso esteja aguardando, informar e manter polling via realtime
      if (data?.waiting) {
        console.log(`[WhatsApp Web Instances] ⏳ QR aguardando geração na VPS: ${instanceId}`);
        toast.info('Gerando QR Code, aguarde alguns segundos...');
        return data;
      }

      throw new Error(data?.error || 'Erro ao atualizar QR Code');
    } catch (error: any) {
      console.error(`[WhatsApp Web Instances] ❌ Erro ao atualizar QR:`, error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
      return null;
    }
  }, [loadInstances]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // CORREÇÃO: Adicionar realtime para atualização automática dos cards
  useEffect(() => {
    if (!user?.id) return;

    console.log('[WhatsApp Web Instances] 📡 Configurando realtime para usuário:', user.id);

    const channel = supabase
      .channel(`whatsapp-instances-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `created_by_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[WhatsApp Web Instances] 📱 Realtime update:', payload);
          
          // Recarregar instâncias quando houver mudanças
          loadInstances();
          
          // CORREÇÃO: Mostrar toast quando instância conectar
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const newStatus = payload.new.connection_status;
            const oldStatus = payload.old.connection_status;
            const instanceName = payload.new.instance_name;
            
            // Detectar conexão com múltiplos status
            const wasDisconnected = !['ready', 'connected', 'open'].includes(oldStatus);
            const isNowConnected = ['ready', 'connected', 'open'].includes(newStatus);
            
            if (wasDisconnected && isNowConnected) {
              const phoneInfo = payload.new.phone ? ` 📱 ${payload.new.phone}` : '';
              const profileInfo = payload.new.profile_name ? ` (${payload.new.profile_name})` : '';
              
              toast.success(`${instanceName} conectado!${phoneInfo}${profileInfo}`, {
                duration: 6000
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[WhatsApp Web Instances] 🔌 Removendo realtime');
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadInstances]);

  return {
    instances,
    isLoading,
    loadInstances,
    deleteInstance,
    refreshQRCode
  };
};
