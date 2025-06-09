import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AsyncStatusService } from "@/services/whatsapp/asyncStatusService";

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
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // NOVO: Query otimizada com polling inteligente
  const {
    data: instances = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['whatsappWebInstances', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('[Hook] ⏭️ ASYNC: Usuário não autenticado, retornando array vazio');
        return [];
      }

      console.log('[Hook] 📊 ASYNC: Buscando instâncias para usuário:', user.id);
      
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[Hook] ❌ ASYNC: Erro ao buscar instâncias:', fetchError);
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

      console.log(`[Hook] ✅ ASYNC: Instâncias carregadas: ${mappedInstances.length} para usuário ${user.id}`);
      
      return mappedInstances;
    },
    enabled: !!user?.id,
    refetchInterval: (data) => {
      // NOVO: Polling inteligente baseado no status
      const hasPendingInstances = data?.some(i => 
        i.connection_status === 'vps_pending' || 
        i.connection_status === 'initializing' ||
        i.connection_status === 'waiting_qr'
      );
      
      // Poll mais frequente se há instâncias pendentes
      return hasPendingInstances ? 5000 : 15000; // 5s vs 15s
    }
  });

  // NOVO: Sincronização automática de instâncias pendentes
  useEffect(() => {
    if (!user?.id) return;

    const timer = setTimeout(async () => {
      const pendingInstances = instances.filter(i => 
        i.connection_status === 'vps_pending' || 
        i.connection_status === 'initializing'
      );

      if (pendingInstances.length > 0) {
        console.log(`[Hook] 🔄 ASYNC: Auto-sincronizando ${pendingInstances.length} instâncias pendentes`);
        
        for (const instance of pendingInstances) {
          try {
            await AsyncStatusService.syncInstanceStatus(instance.id);
          } catch (error) {
            console.log(`[Hook] ⚠️ ASYNC: Erro na auto-sincronização de ${instance.instance_name}:`, error);
          }
        }
        
        // Atualizar dados após sincronização
        refetch();
      }
    }, 3000); // Aguardar 3s após carregar para auto-sincronizar

    return () => clearTimeout(timer);
  }, [instances, user?.id, refetch]);

  const createInstance = useCallback(async (instanceName: string) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 ASYNC: Criando instância assíncrona:', instanceName, 'para usuário:', user.id);
      
      // NOVO: Criação assíncrona com resposta imediata
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      if (error) {
        console.error('[Hook] ❌ ASYNC: Erro do Supabase:', error);
        throw new Error(`Erro na criação: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na criação da instância');
      }

      console.log('[Hook] ✅ ASYNC: Resposta da criação:', data);
      
      // NOVO: Estratégias diferentes baseadas no resultado
      if (data.creation_strategy === 'vps_success') {
        // VPS criou com sucesso - abrir modal imediatamente
        console.log('[Hook] 🎯 ASYNC: VPS sucesso - abrindo modal QR');
        setSelectedInstanceName(instanceName);
        setSelectedInstanceId(data.instance.id);
        setShowQRModal(true);
        toast.success(`Instância "${instanceName}" criada com sucesso!`);
        
      } else if (data.creation_strategy === 'async_pending') {
        // VPS pendente - aguardar em background
        console.log('[Hook] ⏳ ASYNC: VPS pendente - iniciando polling');
        setSelectedInstanceName(instanceName);
        setSelectedInstanceId(data.instance.id);
        setShowQRModal(true);
        toast.info(`Instância "${instanceName}" criada - verificando VPS em background...`);
        
        // NOVO: Iniciar polling assíncrono
        setTimeout(async () => {
          const success = await AsyncStatusService.startPollingForInstance(data.instance.id, 8);
          if (success) {
            refetch(); // Atualizar lista quando polling for bem-sucedido
          }
        }, 2000);
      }
      
      // Atualizar cache
      await refetch();
      
      return data;

    } catch (error: any) {
      console.error('[Hook] ❌ ASYNC: Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      
      setShowQRModal(false);
      setSelectedInstanceId('');
      setSelectedInstanceName('');
      
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
      console.log('[Hook] 🗑️ ASYNC: Deletando instância:', instanceId, 'para usuário:', user.id);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[Hook] ❌ ASYNC: Erro do Supabase:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao deletar instância');
      }

      await refetch();
      toast.success('Instância deletada com sucesso!');

    } catch (error: any) {
      console.error('[Hook] ❌ ASYNC: Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
      throw error;
    }
  }, [user?.id, refetch]);

  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 ASYNC: Atualizando QR Code:', instanceId);
      
      // NOVO: Tentar sincronizar status primeiro
      const syncResult = await AsyncStatusService.syncInstanceStatus(instanceId);
      
      if (syncResult.success) {
        console.log('[Hook] ✅ ASYNC: Status sincronizado, tentando QR service');
        await refetch(); // Atualizar dados após sincronização
      }
      
      // Tentar via QR service como fallback
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

      if (showQRModal && data.qrCode) {
        setSelectedQRCode(data.qrCode);
      }

      await refetch();
      
      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[Hook] ❌ ASYNC: Erro ao gerar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [refetch, showQRModal]);

  const generateIntelligentInstanceName = useCallback(async (userEmail: string) => {
    const emailPrefix = userEmail.split('@')[0];
    const timestamp = Date.now();
    return `whatsapp_${emailPrefix}_${timestamp}`;
  }, []);

  const closeQRModal = useCallback(() => {
    console.log('[Hook] 🧹 ASYNC: Fechando modal QR');
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
    setSelectedInstanceId('');
  }, []);

  const retryQRCode = useCallback(async () => {
    console.log('[Hook] 🔄 ASYNC: Retry QR Code solicitado');
    
    if (selectedInstanceId && !selectedInstanceId.startsWith('temp_')) {
      await refreshQRCode(selectedInstanceId);
    } else {
      await refetch();
    }
  }, [selectedInstanceId, refreshQRCode, refetch]);

  // NOVO: Função para sincronizar instâncias pendentes manualmente
  const syncPendingInstances = useCallback(async () => {
    try {
      console.log('[Hook] 🔄 ASYNC: Sincronização manual de instâncias pendentes');
      const result = await AsyncStatusService.recoverPendingInstances();
      
      if (result.recovered > 0) {
        await refetch(); // Atualizar lista se alguma foi recuperada
      }
      
      return result;
    } catch (error: any) {
      console.error('[Hook] ❌ ASYNC: Erro na sincronização manual:', error);
      toast.error(`Erro na sincronização: ${error.message}`);
      return { recovered: 0, errors: [error.message] };
    }
  }, [refetch]);

  return {
    instances,
    isLoading,
    isConnecting,
    error: error?.message || null,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    selectedInstanceId,
    refetch,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName,
    closeQRModal,
    retryQRCode,
    syncPendingInstances // NOVO: Função para sincronização manual
  };
};
