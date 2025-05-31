
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
  profile_pic_url?: string;
  company_id: string;
}

export const useWhatsAppWebInstances = (companyId?: string, companyLoading?: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async () => {
    if (!companyId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Filtrar apenas instâncias WhatsApp Web.js (sem Evolution)
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .or('connection_type.eq.web,vps_instance_id.not.is.null')
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

  const createInstance = async (instanceName: string): Promise<WhatsAppWebInstance | null> => {
    try {
      setLoading(true);
      
      console.log('Creating instance with WhatsAppWebService:', instanceName);
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create instance');
      }

      console.log('Instance creation result:', result);
      
      // Buscar a instância recém-criada do banco
      await fetchInstances();
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar novamente as instâncias para pegar a recém-criada
      const { data: updatedInstances, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('instance_name', instanceName)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching created instance:', fetchError);
        throw new Error(fetchError.message);
      }

      const newInstance = updatedInstances?.[0];
      console.log('Found created instance:', newInstance);
      
      if (newInstance) {
        // Atualizar a lista local de instâncias
        setInstances(prev => {
          const exists = prev.find(i => i.id === newInstance.id);
          if (exists) {
            return prev.map(i => i.id === newInstance.id ? newInstance : i);
          }
          return [newInstance, ...prev];
        });
        
        return newInstance;
      }
      
      return null;
      
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

      toast.success('WhatsApp desconectado com sucesso!');
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

  // Subscribe to real-time updates for connection status changes
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
          
          // Se uma instância foi conectada (status mudou para ready/open), mostrar toast
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newStatus = payload.new.web_status;
            const oldStatus = payload.old?.web_status;
            
            if ((newStatus === 'ready' || newStatus === 'open') && 
                oldStatus !== 'ready' && oldStatus !== 'open') {
              toast.success('WhatsApp conectado com sucesso!');
            }
          }
          
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
    createInstance,
    deleteInstance: async (instanceId: string) => {
      try {
        setLoading(true);
        
        const result = await WhatsAppWebService.deleteInstance(instanceId);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete instance');
        }

        toast.success('WhatsApp desconectado com sucesso!');
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
    },
    refreshQRCode: async (instanceId: string) => {
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
    },
    sendMessage: async (instanceId: string, phone: string, message: string) => {
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
    },
    refetch: fetchInstances
  };
};
