
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { useAutoQRModal } from "./useAutoQRModal";

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  phone?: string;
  connection_status: string;
  web_status?: string;
  qr_code?: string;
  vps_instance_id?: string;
  created_at: string;
  date_connected?: string;
  profile_name?: string;
}

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sistema de QR automático
  const { modalState, openQRModal, closeModal, retryQRCode } = useAutoQRModal();

  // Buscar instâncias
  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInstances(data || []);
    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao buscar instâncias:', error);
      setError(error.message);
      toast.error('Erro ao carregar instâncias');
    } finally {
      setIsLoading(false);
    }
  };

  // Criar nova instância
  const createInstance = async (instanceName: string) => {
    try {
      setIsConnecting(true);
      console.log('[Instances Hook] 🚀 Criando instância:', instanceName);

      const result = await WhatsAppWebService.createInstance(instanceName);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar instância');
      }

      console.log('[Instances Hook] ✅ Instância criada:', result.instance);

      // Atualizar lista
      await fetchInstances();

      // Abrir modal automático
      const newInstance = result.instance;
      if (newInstance?.id) {
        console.log('[Instances Hook] 📱 Abrindo modal automático...');
        openQRModal(newInstance.id, newInstance.instance_name);
        
        toast.success(`Instância "${instanceName}" criada! Aguarde o QR Code...`);
      } else {
        toast.warning('Instância criada, mas QR Code não disponível imediatamente');
      }

    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Deletar instância
  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Instances Hook] 🗑️ Deletando instância:', instanceId);

      const result = await WhatsAppWebService.deleteInstance(instanceId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar instância');
      }

      // Atualizar lista
      await fetchInstances();
      toast.success('Instância deletada com sucesso');

    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
    }
  };

  // Gerar novo QR Code (fallback manual)
  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Instances Hook] 🔄 Gerando novo QR Code para:', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Abrir modal automático
      openQRModal(instanceId, instance.instance_name);
      
      // Tentar via edge function como fallback
      setTimeout(() => {
        retryQRCode();
      }, 2000);

      toast.info('Gerando novo QR Code...');

    } catch (error: any) {
      console.error('[Instances Hook] ❌ Erro ao gerar QR:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    }
  };

  // Configurar subscription em tempo real para atualizações
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
          console.log('[Instances Hook] 📡 Atualização em tempo real:', payload);
          
          // Recarregar instâncias quando houver mudanças
          fetchInstances();
          
          // Notificar sobre mudanças de status
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newStatus = payload.new.connection_status;
            const oldStatus = payload.old?.connection_status;
            
            if (newStatus !== oldStatus) {
              if (newStatus === 'connected') {
                toast.success(`${payload.new.instance_name} conectado!`);
              } else if (newStatus === 'disconnected') {
                toast.warning(`${payload.new.instance_name} desconectado`);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    
    // Modal controls
    closeQRModal: closeModal,
    retryQRCode
  };
};
