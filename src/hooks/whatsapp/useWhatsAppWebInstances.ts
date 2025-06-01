
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  company_id: string;
}

export interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  activeInstanceId: string | null;
  error: string | null;
}

export const useWhatsAppWebInstances = (companyId?: string, companyLoading?: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoConnectState, setAutoConnectState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    activeInstanceId: null,
    error: null
  });

  const generateInstanceName = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `whatsapp_${timestamp}_${random}`;
  };

  const fetchInstances = async () => {
    if (!companyId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setInstances(data || []);
    } catch (err) {
      console.error('Error fetching WhatsApp Web instances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startAutoConnection = async () => {
    try {
      setAutoConnectState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null 
      }));

      const instanceName = generateInstanceName();
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao criar instância');
      }

      const newInstanceId = result.instance?.id;
      if (newInstanceId) {
        setAutoConnectState(prev => ({
          ...prev,
          activeInstanceId: newInstanceId,
          showQRModal: true
        }));
      }

      toast.success('Instância criada! Escaneie o QR code para conectar.');
      await fetchInstances();

    } catch (error) {
      console.error('Error in auto connect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setAutoConnectState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false
      }));
      
      toast.error(errorMessage);
    } finally {
      setAutoConnectState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const createInstance = async (instanceName: string): Promise<void> => {
    try {
      setLoading(true);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create instance');
      }

      toast.success('Instância WhatsApp criada com sucesso!');
      await fetchInstances();
      
    } catch (err) {
      console.error('Error creating instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar instância';
      toast.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setLoading(true);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete instance');
      }

      toast.success('Instância removida com sucesso!');
      await fetchInstances();
      
    } catch (err) {
      console.error('Error deleting instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover instância';
      toast.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('Instance not found');
      }

      const result = await WhatsAppWebService.getQRCode(instance.vps_instance_id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get QR code');
      }

      // Update instance in state
      setInstances(prev => prev.map(i => 
        i.id === instanceId 
          ? { ...i, qr_code: result.qrCode } 
          : i
      ));

      return result.qrCode;
    } catch (err) {
      console.error('Error refreshing QR code:', err);
      toast.error('Erro ao atualizar QR code');
      throw err;
    }
  };

  const sendMessage = async (instanceId: string, phone: string, message: string) => {
    try {
      const result = await WhatsAppWebService.sendMessage(instanceId, phone, message);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Erro ao enviar mensagem');
      throw err;
    }
  };

  const closeQRModal = () => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: false,
      activeInstanceId: null 
    }));
  };

  const openQRModal = (instanceId: string) => {
    setAutoConnectState(prev => ({ 
      ...prev, 
      showQRModal: true,
      activeInstanceId: instanceId 
    }));
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('whatsapp-web-instances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('WhatsApp Web instance change:', payload);
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Só buscar instâncias quando companyId estiver disponível e não estiver carregando
  useEffect(() => {
    if (companyLoading) {
      setLoading(true);
      return;
    }
    
    fetchInstances();
  }, [companyId, companyLoading]);

  return {
    instances,
    loading,
    error,
    autoConnectState,
    createInstance,
    deleteInstance,
    refreshQRCode,
    sendMessage,
    startAutoConnection,
    closeQRModal,
    openQRModal,
    refetch: fetchInstances
  };
};
