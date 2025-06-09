
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code: string | null;
  phone: string | null;
  profile_name: string | null;
  profile_pic_url: string | null;
  date_connected: string | null;
  date_disconnected: string | null;
  company_id: string | null;
  created_by_user_id: string | null;
  history_imported?: boolean;
}

export const useWhatsAppWebInstances = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // CORREÇÃO: Query otimizada com melhor tratamento de estados
  const {
    data: instances = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['whatsappWebInstances', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[Hook] ⏭️ CORREÇÃO: Usuário não autenticado, retornando array vazio');
        return [];
      }

      console.log('[Hook] 📊 CORREÇÃO: Buscando instâncias para usuário:', user.id);
      
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[Hook] ❌ CORREÇÃO: Erro ao buscar instâncias:', fetchError);
        throw fetchError;
      }

      const mappedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        connection_type: instance.connection_type || 'web',
        server_url: instance.server_url || '',
        vps_instance_id: instance.vps_instance_id || '',
        web_status: instance.web_status || '',
        connection_status: instance.connection_status || '',
        qr_code: instance.qr_code,
        phone: instance.phone,
        profile_name: instance.profile_name,
        profile_pic_url: instance.profile_pic_url,
        date_connected: instance.date_connected,
        date_disconnected: instance.date_disconnected,
        company_id: instance.company_id,
        created_by_user_id: instance.created_by_user_id,
        history_imported: instance.history_imported || false
      }));

      console.log(`[Hook] ✅ CORREÇÃO: Instâncias carregadas: ${mappedInstances.length} para usuário ${user.id}`);
      
      // CORREÇÃO: Verificar instâncias aguardando QR Code
      const waitingInstances = mappedInstances.filter(i => i.connection_status === 'waiting_qr');
      if (waitingInstances.length > 0) {
        console.log('[Hook] 🔍 CORREÇÃO: Instâncias aguardando QR Code:', waitingInstances.length);
        
        // CORREÇÃO: Abrir modal automaticamente para primeira instância aguardando
        const firstWaiting = waitingInstances[0];
        if (!showQRModal) {
          console.log('[Hook] 📱 CORREÇÃO: Abrindo modal automático para:', firstWaiting.instance_name);
          setSelectedInstanceName(firstWaiting.instance_name);
          setShowQRModal(true);
          
          // CORREÇÃO: Iniciar polling para aguardar QR Code
          setTimeout(() => {
            refetch();
          }, 3000);
        }
      }
      
      return mappedInstances;
    },
    enabled: !!user?.id,
    refetchInterval: (data) => {
      // CORREÇÃO: Polling automático quando há instâncias aguardando
      const hasWaitingInstances = data?.some(i => i.connection_status === 'waiting_qr' || i.connection_status === 'initializing');
      return hasWaitingInstances ? 5000 : false; // Poll a cada 5s se aguardando
    }
  });

  const createInstance = useCallback(async (instanceName: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 CORREÇÃO: Criando instância:', instanceName, 'para usuário:', user.id);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      if (error) {
        console.error('[Hook] ❌ CORREÇÃO: Erro do Supabase:', error);
        throw new Error(`Erro na criação: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na criação da instância');
      }

      console.log('[Hook] ✅ CORREÇÃO: Instância criada:', data.instance);
      
      // CORREÇÃO: Atualizar cache e mostrar sucesso
      await refetch();
      
      toast.success(`Instância "${instanceName}" criada! Aguardando QR Code via webhook...`);
      
      return data;

    } catch (error: any) {
      console.error('[Hook] ❌ CORREÇÃO: Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [user?.id, refetch]);

  const deleteInstance = useCallback(async (instanceId: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('[Hook] 🗑️ CORREÇÃO: Deletando instância:', instanceId, 'para usuário:', user.id);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[Hook] ❌ CORREÇÃO: Erro do Supabase:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao deletar instância');
      }

      await refetch();
      toast.success('Instância deletada com sucesso!');

    } catch (error: any) {
      console.error('[Hook] ❌ CORREÇÃO: Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
      throw error;
    }
  }, [user?.id, refetch]);

  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 CORREÇÃO: Atualizando QR Code:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      if (!data?.success) {
        if (data?.waiting) {
          return {
            success: false,
            waiting: true,
            message: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data?.error || 'Erro desconhecido ao gerar QR Code');
      }

      await refetch();
      
      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[Hook] ❌ CORREÇÃO: Erro ao gerar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [refetch]);

  const generateIntelligentInstanceName = useCallback(async (userEmail: string) => {
    const emailPrefix = userEmail.split('@')[0];
    const timestamp = Date.now();
    return `whatsapp_${emailPrefix}_${timestamp}`;
  }, []);

  const closeQRModal = useCallback(() => {
    console.log('[Hook] 🧹 CORREÇÃO: Fechando modal QR');
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  }, []);

  const retryQRCode = useCallback(async () => {
    console.log('[Hook] 🔄 CORREÇÃO: Retry QR Code solicitado');
    await refetch();
  }, [refetch]);

  return {
    instances,
    isLoading,
    isConnecting,
    error: error?.message || null,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    refetch,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName,
    closeQRModal,
    retryQRCode
  };
};
