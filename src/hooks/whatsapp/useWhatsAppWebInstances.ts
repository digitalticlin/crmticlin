
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { useAutoQRModal } from "./useAutoQRModal";
import { AsyncStatusService } from "@/services/whatsapp/asyncStatusService";
import { useIntelligentNaming } from "./useIntelligentNaming";

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sistema de QR automático
  const { modalState, openQRModal, closeModal, retryQRCode } = useAutoQRModal();
  
  // Hook de nomeação inteligente
  const { generateIntelligentInstanceName } = useIntelligentNaming();

  // Buscar instâncias
  const fetchInstances = async (): Promise<WhatsAppWebInstance[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const instancesData = data || [];
      setInstances(instancesData);
      return instancesData;
    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao buscar instâncias:', error);
      setError(error.message);
      toast.error('Erro ao carregar instâncias');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Criar nova instância usando edge function correta
  const createInstance = async (userEmail: string): Promise<{ success: boolean; instance?: WhatsAppWebInstance; error?: string }> => {
    try {
      setIsConnecting(true);
      console.log('[Instances Hook] 🚀 CORREÇÃO: Usando edge functions corretas...');
      console.log('[Instances Hook] 📧 Email do usuário:', userEmail);

      // Gerar nome inteligente
      const intelligentName = await generateIntelligentInstanceName(userEmail);
      console.log('[Instances Hook] 🎯 Nome gerado:', intelligentName);

      console.log('[Instances Hook] 📋 CORREÇÃO: Chamando WhatsAppWebService.createInstance corrigido...');

      // CORREÇÃO: Usar WhatsAppWebService corrigido (que usa whatsapp_instance_manager)
      const result = await WhatsAppWebService.createInstance(intelligentName);

      console.log('[Instances Hook] 📥 CORREÇÃO: Resultado do service corrigido:', result);

      if (!result.success) {
        console.error('[Instances Hook] ❌ CORREÇÃO: Falha detectada:', result.error);
        throw new Error(result.error || 'Erro desconhecido na criação da instância');
      }

      console.log('[Instances Hook] ✅ CORREÇÃO: Instância criada com sucesso via edge functions corretas');

      // Atualizar lista
      await fetchInstances();

      // CORREÇÃO: Abrir modal SEMPRE após criação bem-sucedida (resposta instantânea)
      const newInstance = result.instance;
      if (newInstance?.id) {
        console.log('[Instances Hook] 📱 CORREÇÃO: Abrindo modal QR instantaneamente...');
        openQRModal(newInstance.id, newInstance.instance_name);
        toast.success(`Instância "${intelligentName}" criada! Modal QR aberto - aguarde o QR code...`);
      } else {
        console.warn('[Instances Hook] ⚠️ Instância criada mas sem ID válido');
        toast.warning('Instância criada, mas dados não disponíveis imediatamente');
      }

      return { success: true, instance: newInstance };

    } catch (error: any) {
      console.error('[Instances Hook] ❌ CORREÇÃO: Erro capturado:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  // Deletar instância
  const deleteInstance = async (instanceId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Instances Hook] 🗑️ CORREÇÃO: Deletando via edge functions corretas:', instanceId);

      const result = await WhatsAppWebService.deleteInstance(instanceId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar instância');
      }

      // Atualizar lista
      await fetchInstances();
      toast.success('Instância deletada com sucesso');

      return { success: true };

    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // CORREÇÃO: Gerar novo QR Code usando whatsapp_qr_service
  const refreshQRCode = async (instanceId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> => {
    try {
      console.log('[Instances Hook] 🔄 CORREÇÃO: Gerando QR via whatsapp_qr_service:', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Abrir modal automático
      openQRModal(instanceId, instance.instance_name);
      
      // CORREÇÃO: Usar WhatsAppWebService.refreshQRCode (que usa whatsapp_qr_service)
      const result = await WhatsAppWebService.refreshQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        toast.success('QR Code gerado com sucesso!');
        return { success: true, qrCode: result.qrCode };
      } else if (result.waiting) {
        toast.info('QR Code sendo preparado...');
        // Tentar novamente em 3 segundos
        setTimeout(() => {
          retryQRCode();
        }, 3000);
        return { success: true };
      } else {
        throw new Error(result.error || 'Erro ao gerar QR Code');
      }

    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao gerar QR:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Sincronizar instâncias pendentes
  const syncPendingInstances = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Instances Hook] 🔄 CORREÇÃO: Sincronizando via edge functions corretas...');

      const result = await AsyncStatusService.recoverPendingInstances();

      if (result.recovered > 0) {
        await fetchInstances();
        toast.success(`${result.recovered} instâncias sincronizadas!`);
      } else if (result.errors.length > 0) {
        toast.warning(`Nenhuma instância recuperada. ${result.errors.length} erros encontrados.`);
      } else {
        toast.info('Nenhuma instância precisava de sincronização');
      }

      return { success: true };

    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao sincronizar:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // CORREÇÃO: Subscription melhorado para funcionar com edge functions corretas
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-instances-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: 'connection_type=eq.web'
        },
        (payload) => {
          console.log('[Instances Hook] 📡 CORREÇÃO: Atualização em tempo real:', payload);
          
          // Recarregar instâncias quando houver mudanças
          fetchInstances();
          
          // Notificar sobre mudanças de status
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newStatus = payload.new.connection_status;
            const oldStatus = payload.old?.connection_status;
            
            if (newStatus !== oldStatus) {
              if (newStatus === 'connected') {
                toast.success(`${payload.new.instance_name} conectado!`);
                // Fechar modal quando conectar
                closeModal();
              } else if (newStatus === 'disconnected') {
                toast.warning(`${payload.new.instance_name} desconectado`);
              } else if (newStatus === 'waiting_qr') {
                toast.info(`${payload.new.instance_name} aguardando QR Code`);
              }
            }
            
            // CORREÇÃO: Se QR code foi atualizado, notificar o modal
            if (payload.new.qr_code && payload.new.qr_code !== payload.old?.qr_code) {
              console.log('[Instances Hook] 📱 CORREÇÃO: QR Code atualizado via webhook!');
              toast.success('QR Code recebido via webhook!');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [closeModal]);

  // Carregar instâncias na inicialização
  useEffect(() => {
    fetchInstances();
  }, []);

  return {
    instances,
    isLoading,
    isConnecting,
    error,
    
    // Modal automático
    showQRModal: modalState.isOpen,
    selectedQRCode: modalState.qrCode,
    selectedInstanceName: modalState.instanceName,
    
    // Ações
    createInstance,
    deleteInstance,
    refreshQRCode,
    refetch: fetchInstances,
    fetchInstances,
    syncPendingInstances,
    
    // Exportar função de nomeação para outros componentes
    generateIntelligentInstanceName,
    
    // Modal controls
    closeQRModal: closeModal,
    retryQRCode
  };
};
