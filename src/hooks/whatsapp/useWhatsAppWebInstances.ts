
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useInstanceActions } from './services/instanceActionsService';

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  phone: string;
  connection_status: string;
  web_status?: string;
  qr_code?: string;
  date_connected?: string;
  date_disconnected?: string;
  vps_instance_id?: string;
  server_url?: string;
  updated_at?: string;
  profile_name?: string;
  profile_pic_url?: string;
}

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  
  const { user } = useAuth();
  const { companyId } = useCompanyData();

  // Fetch instances from database
  const fetchInstances = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('[WhatsApp Web Instances] 📋 Buscando instâncias da empresa:', companyId);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log('[WhatsApp Web Instances] ✅ Instâncias carregadas:', data?.length || 0);
      setInstances(data || []);

    } catch (err: any) {
      console.error('[WhatsApp Web Instances] ❌ Erro ao buscar instâncias:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO FASE 3.1: Função para atualizar QR Code de uma instância específica
  const refreshInstanceQRCode = async (instanceId: string) => {
    try {
      console.log('[WhatsApp Web Instances] 🔄 Atualizando QR Code (FASE 3.1):', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('VPS Instance ID não encontrado');
      }

      // Chamar Edge Function para obter QR Code atualizado
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'refresh_qr_code',
          instanceData: {
            instanceId: instance.vps_instance_id
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao atualizar QR Code');
      }

      console.log('[WhatsApp Web Instances] ✅ QR Code atualizado com sucesso');

      // Recarregar instâncias para obter dados atualizados
      await fetchInstances();

      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[WhatsApp Web Instances] ❌ Erro ao atualizar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Use instance actions service
  const { createInstance, deleteInstance, refreshQRCode } = useInstanceActions(fetchInstances);

  // Close QR Modal
  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  };

  // CORREÇÃO FASE 3.1: Buscar QR Code atualizado automaticamente para instâncias em waiting_scan
  useEffect(() => {
    if (!instances.length) return;

    const checkForQRUpdates = () => {
      instances.forEach(async (instance) => {
        if (instance.web_status === 'waiting_scan' && instance.vps_instance_id) {
          // Verificar se QR code precisa ser atualizado (opcional - apenas se necessário)
          const lastUpdate = instance.updated_at ? new Date(instance.updated_at) : new Date(0);
          const now = new Date();
          const timeDiff = now.getTime() - lastUpdate.getTime();
          
          // Atualizar QR Code se a última atualização foi há mais de 30 segundos
          if (timeDiff > 30000) {
            console.log('[WhatsApp Web Instances] 🔄 Auto-refresh QR Code para:', instance.instance_name);
            await refreshInstanceQRCode(instance.id);
          }
        }
      });
    };

    // Verificar atualizações a cada 30 segundos
    const interval = setInterval(checkForQRUpdates, 30000);

    return () => clearInterval(interval);
  }, [instances]);

  // Real-time subscriptions for instance updates
  useEffect(() => {
    if (!companyId) return;

    console.log('[WhatsApp Web Instances] 🔄 Configurando real-time updates para empresa:', companyId);

    const channel = supabase
      .channel('whatsapp-instances-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('[WhatsApp Web Instances] 📡 Real-time update:', payload);
          fetchInstances(); // Recarregar dados quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Initial fetch
  useEffect(() => {
    fetchInstances();
  }, [companyId]);

  return {
    instances,
    isLoading,
    isConnecting,
    error,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    refetch: fetchInstances,
    fetchInstances,
    createInstance: async (instanceName: string) => {
      setIsConnecting(true);
      try {
        const result = await createInstance(instanceName);
        return result;
      } finally {
        setIsConnecting(false);
      }
    },
    deleteInstance,
    refreshQRCode: refreshInstanceQRCode,
    closeQRModal
  };
};
