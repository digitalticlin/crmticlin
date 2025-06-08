
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InstanceCreationState {
  isCreating: boolean;
  instanceId: string | null;
  qrCode: string | null;
  status: string | null;
  error: string | null;
}

/**
 * Hook para criação de instância com feedback real-time
 * Separado do processo de sincronização de 10 minutos
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

  // Criar instância e começar acompanhamento real-time
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

      // 1. Criar instância na VPS
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'create_instance',
          instanceData: { instanceName }
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao criar instância');
      }

      const instanceId = data.instanceId || instanceName;
      console.log('[Instance Creation] ✅ Instância criada na VPS:', instanceId);

      setState(prev => ({
        ...prev,
        instanceId,
        status: 'created'
      }));

      // 2. Adicionar registro no Supabase IMEDIATAMENTE
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName,
          vps_instance_id: instanceId,
          connection_type: 'web',
          connection_status: 'created',
          web_status: 'created',
          created_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('[Instance Creation] ⚠️ Erro ao salvar no Supabase:', dbError);
        // Não bloquear, a sincronização vai corrigir depois
      } else {
        console.log('[Instance Creation] ✅ Instância salva no Supabase');
      }

      // 3. Iniciar polling para status e QR Code
      startStatusPolling(instanceId);

      toast.success('Instância criada! Aguardando QR Code...');
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

  // Polling inteligente para status e QR Code
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

      attempts++;

      try {
        // Buscar status da VPS
        const { data: statusData, error: statusError } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_instance_status',
            instanceId
          }
        });

        if (statusError || !statusData?.success) {
          console.warn('[Instance Creation] ⚠️ Erro no polling (tentativa ' + attempts + '):', statusError?.message);
          return;
        }

        const { status, qrCode, phone, profileName } = statusData.data || {};
        
        console.log('[Instance Creation] 📊 Status polling:', { 
          status, 
          hasQR: !!qrCode, 
          phone: phone?.slice(0, 8) + '...' 
        });

        setState(prev => ({
          ...prev,
          status,
          qrCode: qrCode || prev.qrCode,
          isCreating: status !== 'open' && status !== 'ready'
        }));

        // Atualizar Supabase com novos dados
        if (status || phone || profileName) {
          const updateData: any = {
            updated_at: new Date().toISOString()
          };

          if (status) {
            updateData.connection_status = status === 'open' ? 'ready' : status;
            updateData.web_status = status === 'open' ? 'ready' : status;
          }

          if (phone) updateData.phone = phone;
          if (profileName) updateData.profile_name = profileName;

          if (status === 'open' || status === 'ready') {
            updateData.date_connected = new Date().toISOString();
          }

          await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('vps_instance_id', instanceId);
        }

        // Parar polling se conectou
        if (status === 'open' || status === 'ready') {
          console.log('[Instance Creation] ✅ Instância conectada!');
          toast.success('WhatsApp conectado com sucesso!');
          
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

      } catch (error) {
        console.warn('[Instance Creation] ⚠️ Erro no polling:', error);
      }
    };

    // Polling a cada 5 segundos
    pollingRef.current = setInterval(pollStatus, 5000);
    
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
