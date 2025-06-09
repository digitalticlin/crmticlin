
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QRModalState {
  isOpen: boolean;
  qrCode: string | null;
  instanceId: string | null;
  instanceName: string | null;
  isWaiting: boolean;
  error: string | null;
}

export const useAutoQRModal = () => {
  const [modalState, setModalState] = useState<QRModalState>({
    isOpen: false,
    qrCode: null,
    instanceId: null,
    instanceName: null,
    isWaiting: false,
    error: null
  });

  const [subscription, setSubscription] = useState<any>(null);

  // Função para abrir modal e começar a escutar
  const openQRModal = (instanceId: string, instanceName: string) => {
    console.log('[Auto QR Modal] 🔵 Abrindo modal para:', instanceName);
    
    setModalState({
      isOpen: true,
      qrCode: null,
      instanceId,
      instanceName,
      isWaiting: true,
      error: null
    });

    // Configurar subscription em tempo real
    setupRealtimeSubscription(instanceId);
  };

  // Configurar subscription para receber QR Code em tempo real
  const setupRealtimeSubscription = (instanceId: string) => {
    console.log('[Auto QR Modal] 📡 Configurando subscription para:', instanceId);
    
    // Limpar subscription anterior se existir
    if (subscription) {
      supabase.removeChannel(subscription);
    }

    const channel = supabase
      .channel(`qr-updates-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `id=eq.${instanceId}`
        },
        (payload) => {
          console.log('[Auto QR Modal] 🔄 Update recebido:', payload);
          handleInstanceUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[Auto QR Modal] 📻 Subscription status:', status);
      });

    setSubscription(channel);

    // Verificar se já existe QR Code no banco
    checkExistingQRCode(instanceId);
  };

  // Verificar QR Code existente
  const checkExistingQRCode = async (instanceId: string) => {
    try {
      const { data: instance, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, web_status, instance_name')
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('[Auto QR Modal] ❌ Erro ao buscar instância:', error);
        return;
      }

      if (instance) {
        handleInstanceUpdate(instance);
      }
    } catch (error) {
      console.error('[Auto QR Modal] ❌ Erro inesperado:', error);
    }
  };

  // Processar atualização da instância
  const handleInstanceUpdate = (instance: any) => {
    console.log('[Auto QR Modal] 📊 Processando update:', {
      hasQR: !!instance.qr_code,
      connectionStatus: instance.connection_status,
      webStatus: instance.web_status
    });

    // Se recebeu QR Code
    if (instance.qr_code && instance.qr_code !== modalState.qrCode) {
      console.log('[Auto QR Modal] 📱 QR Code recebido!');
      setModalState(prev => ({
        ...prev,
        qrCode: instance.qr_code,
        isWaiting: false,
        error: null
      }));
      
      toast.success('QR Code gerado! Escaneie com seu WhatsApp');
    }

    // Se conectou com sucesso
    if (instance.connection_status === 'connected' || instance.connection_status === 'ready') {
      console.log('[Auto QR Modal] ✅ Conectado com sucesso!');
      setModalState(prev => ({
        ...prev,
        isOpen: false,
        qrCode: null,
        isWaiting: false
      }));
      
      toast.success(`WhatsApp conectado com sucesso: ${instance.instance_name}`);
      closeModal();
    }

    // Se erro de conexão
    if (instance.connection_status === 'error' || instance.web_status === 'error') {
      console.log('[Auto QR Modal] ❌ Erro de conexão');
      setModalState(prev => ({
        ...prev,
        error: 'Erro na conexão. Tente gerar um novo QR Code.',
        isWaiting: false
      }));
      
      toast.error('Erro na conexão WhatsApp. Tente novamente.');
    }

    // Se desconectou
    if (instance.connection_status === 'disconnected') {
      console.log('[Auto QR Modal] 🔌 Desconectado');
      setModalState(prev => ({
        ...prev,
        error: 'Conexão perdida. Gere um novo QR Code.',
        isWaiting: false
      }));
    }
  };

  // Fechar modal
  const closeModal = () => {
    console.log('[Auto QR Modal] 🔴 Fechando modal');
    
    setModalState({
      isOpen: false,
      qrCode: null,
      instanceId: null,
      instanceName: null,
      isWaiting: false,
      error: null
    });

    // Limpar subscription
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  };

  // Tentar novamente (buscar QR via edge function se webhook falhar)
  const retryQRCode = async () => {
    if (!modalState.instanceId) return;

    console.log('[Auto QR Modal] 🔄 Tentando buscar QR via edge function...');
    
    setModalState(prev => ({
      ...prev,
      isWaiting: true,
      error: null,
      qrCode: null
    }));

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code',
          instanceId: modalState.instanceId
        }
      });

      if (error) throw error;

      if (data?.success && data.qrCode) {
        setModalState(prev => ({
          ...prev,
          qrCode: data.qrCode,
          isWaiting: false,
          error: null
        }));
        
        toast.success('QR Code obtido via fallback!');
      } else {
        throw new Error(data?.error || 'QR Code não disponível');
      }
    } catch (error: any) {
      console.error('[Auto QR Modal] ❌ Erro no retry:', error);
      setModalState(prev => ({
        ...prev,
        isWaiting: false,
        error: `Erro ao buscar QR Code: ${error.message}`
      }));
      
      toast.error('Erro ao buscar QR Code');
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [subscription]);

  return {
    modalState,
    openQRModal,
    closeModal,
    retryQRCode
  };
};
