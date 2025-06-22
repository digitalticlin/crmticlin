
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InstanceApi } from '../api/instanceApi';
import type { QRCodeModalState } from '../types/instanceTypes';

export const useQRCodeModal = () => {
  const [state, setState] = useState<QRCodeModalState>({
    isOpen: false,
    qrCode: null,
    isLoading: false,
    instanceId: null,
    error: null
  });

  // Limpar estado ao fechar
  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      qrCode: null,
      error: null
    }));
  }, []);

  // Configurar subscription para atualizações do QR Code
  useEffect(() => {
    if (!state.instanceId) return;

    const subscription = supabase
      .channel(`instance_${state.instanceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_instances',
        filter: `id=eq.${state.instanceId}`
      }, (payload) => {
        if (payload.new.qr_code) {
          setState(prev => ({
            ...prev,
            qrCode: payload.new.qr_code,
            isLoading: false
          }));
        }

        // Se conectado, fechar modal
        if (payload.new.connection_status === 'ready') {
          toast.success('WhatsApp conectado com sucesso!');
          closeModal();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [state.instanceId, closeModal]);

  // Polling para QR Code como fallback
  useEffect(() => {
    if (!state.instanceId || !state.isLoading) return;

    let attempts = 0;
    const maxAttempts = 30;
    const interval = 2000;

    const pollQRCode = async () => {
      if (attempts >= maxAttempts) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Tempo limite excedido ao aguardar QR Code'
        }));
        return;
      }

      const result = await InstanceApi.getQRCode(state.instanceId!);
      
      if (result.success && result.qrCode) {
        setState(prev => ({
          ...prev,
          qrCode: result.qrCode,
          isLoading: false,
          error: null
        }));
      } else {
        attempts++;
        setTimeout(pollQRCode, interval);
      }
    };

    pollQRCode();
  }, [state.instanceId, state.isLoading]);

  const openModal = useCallback((instanceId: string) => {
    setState({
      isOpen: true,
      qrCode: null,
      isLoading: true,
      instanceId,
      error: null
    });
  }, []);

  return {
    ...state,
    openModal,
    closeModal
  };
};
