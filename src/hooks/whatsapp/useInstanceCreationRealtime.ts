
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSmartPollingManager } from './useSmartPollingManager';
import { useAuth } from '@/contexts/AuthContext';

interface InstanceCreationState {
  isCreating: boolean;
  instanceId: string | null;
  qrCode: string | null;
  status: string | null;
  error: string | null;
}

/**
 * Hook para criação de instância com feedback real-time
 * USA A EDGE FUNCTION CORRETA: whatsapp_instance_manager
 */
export const useInstanceCreationRealtime = () => {
  const [state, setState] = useState<InstanceCreationState>({
    isCreating: false,
    instanceId: null,
    qrCode: null,
    status: null,
    error: null
  });

  const pollingRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const { user } = useAuth();
  const { registerCreation, markAsConnected, shouldActivatePolling } = useSmartPollingManager(user?.id);

  // Criar instância usando whatsapp_instance_manager
  const createInstance = useCallback(async (instanceName: string): Promise<boolean> => {
    setState({
      isCreating: true,
      instanceId: null,
      qrCode: null,
      status: 'creating',
      error: null
    });

    try {
      console.log('[Instance Creation] 🚀 Criando instância:', instanceName);

      // CORREÇÃO: Usar whatsapp_instance_manager em vez de whatsapp_web_server
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: instanceName
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao criar instância');
      }

      const instanceId = data.instance?.id || data.instance?.vps_instance_id || instanceName;
      console.log('[Instance Creation] ✅ Instância criada:', instanceId);

      setState(prev => ({
        ...prev,
        instanceId,
        status: 'created'
      }));

      // Registrar criação no sistema inteligente
      registerCreation(instanceId, instanceName);

      // Iniciar polling para status
      startStatusPolling(instanceId);

      toast.success('Instância criada! Aguardando conexão...');
      return true;

    } catch (error: any) {
      console.error('[Instance Creation] ❌ Erro na criação:', error);
      
      setState(prev => ({
        ...prev,
        isCreating: false,
        error: error.message,
        status: 'error'
      }));

      toast.error('Erro ao criar instância: ' + error.message);
      return false;
    }
  }, []);

  // Polling para status usando whatsapp_instance_manager
  const startStatusPolling = useCallback((instanceId: string) => {
    console.log('[Instance Creation] 📡 Iniciando polling para:', instanceId);
    
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos (5s * 60)

    const pollStatus = async () => {
      if (!isMountedRef.current || attempts >= maxAttempts) {
        console.log('[Instance Creation] ⏹️ Polling finalizado');
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }

      // OTIMIZAÇÃO: Só fazer polling se necessário
      if (!shouldActivatePolling('status')) {
        console.log('[Instance Creation] 💤 Polling pausado - nenhuma criação ativa');
        return;
      }

      attempts++;

      try {
        // Buscar instâncias usando whatsapp_instance_manager
        const { data: listData, error: listError } = await supabase.functions.invoke('whatsapp_instance_manager', {
          body: {
            action: 'list_instances'
          }
        });

        if (listError || !listData?.success) {
          console.warn('[Instance Creation] ⚠️ Erro no polling (tentativa ' + attempts + '):', listError?.message);
          return;
        }

        const instances = listData.instances || [];
        const instance = instances.find((inst: any) => 
          inst.id === instanceId || 
          inst.vps_instance_id === instanceId || 
          inst.instance_name === instanceId
        );

        if (instance) {
          const status = instance.connection_status || instance.web_status || 'unknown';
          
          console.log('[Instance Creation] 📊 Status polling:', { 
            status, 
            instanceId,
            connection_status: instance.connection_status,
            web_status: instance.web_status
          });

          setState(prev => ({
            ...prev,
            status,
            isCreating: !['open', 'ready', 'connected'].includes(status)
          }));

          // Parar polling se conectou
          if (['open', 'ready', 'connected'].includes(status)) {
            console.log('[Instance Creation] ✅ Instância conectada!');
            toast.success('WhatsApp conectado com sucesso!');
            
            // Marcar como conectada no sistema inteligente (para polling)
            markAsConnected(instanceId);
            
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = undefined;
            }
            
            setState(prev => ({
              ...prev,
              isCreating: false,
              status
            }));
          }
        }

      } catch (error) {
        console.warn('[Instance Creation] ⚠️ Erro no polling:', error);
      }
    };

    // Polling a cada 15 segundos (reduzido de 5s para evitar quota exceeded)
    pollingRef.current = setInterval(pollStatus, 10000); // OTIMIZADO: 10s durante criação - para automaticamente quando conecta
    
    // Primeira verificação imediata
    pollStatus();
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = undefined;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    setState({
      isCreating: false,
      instanceId: null,
      qrCode: null,
      status: null,
      error: null
    });
  }, [cleanup]);

  return {
    ...state,
    createInstance,
    cleanup,
    reset
  };
};
