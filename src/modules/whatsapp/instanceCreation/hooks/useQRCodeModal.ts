
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
      error: null,
      isLoading: false
    }));
  }, []);

  // Buscar QR Code do Supabase quando modal abrir
  const fetchQRCodeFromSupabase = useCallback(async (instanceId: string) => {
    try {
      console.log('[useQRCodeModal] 🔍 Buscando QR Code do Supabase para:', instanceId);
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, instance_name')
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('[useQRCodeModal] ❌ Erro ao buscar QR Code:', error);
        setState(prev => ({
          ...prev,
          error: 'Erro ao carregar QR Code',
          isLoading: false
        }));
        return;
      }

      console.log('[useQRCodeModal] 📱 Dados da instância:', { 
        hasQR: !!data.qr_code, 
        status: data.connection_status,
        name: data.instance_name 
      });

      // Se já está conectado, fechar modal
      if (data.connection_status === 'ready' || data.connection_status === 'connected') {
        console.log('[useQRCodeModal] ✅ Instância já conectada, fechando modal');
        toast.success('WhatsApp já está conectado!');
        closeModal();
        return;
      }

      // Se tem QR Code, mostrar imediatamente
      if (data.qr_code && data.qr_code !== 'waiting') {
        console.log('[useQRCodeModal] ✅ QR Code encontrado no Supabase');
        setState(prev => ({
          ...prev,
          qrCode: data.qr_code,
          isLoading: false,
          error: null
        }));
      } else {
        console.log('[useQRCodeModal] ⏳ QR Code ainda não disponível, aguardando...');
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null
        }));
      }

    } catch (err: any) {
      console.error('[useQRCodeModal] ❌ Erro inesperado:', err);
      setState(prev => ({
        ...prev,
        error: err.message,
        isLoading: false
      }));
    }
  }, [closeModal]);

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
        console.log('[useQRCodeModal] 🔄 Atualização em tempo real:', payload.new);
        
        const newData = payload.new as any;
        
        // Se QR Code foi atualizado
        if (newData.qr_code && newData.qr_code !== state.qrCode) {
          console.log('[useQRCodeModal] 📱 Novo QR Code recebido via real-time');
          setState(prev => ({
            ...prev,
            qrCode: newData.qr_code,
            isLoading: false,
            error: null
          }));
        }

        // Se conectado, fechar modal
        if (newData.connection_status === 'ready' || newData.connection_status === 'connected') {
          console.log('[useQRCodeModal] ✅ Conectado via real-time, fechando modal');
          toast.success('WhatsApp conectado com sucesso!');
          closeModal();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [state.instanceId, state.qrCode, closeModal]);

  // Buscar QR Code quando modal abrir
  useEffect(() => {
    if (state.isOpen && state.instanceId) {
      fetchQRCodeFromSupabase(state.instanceId);
    }
  }, [state.isOpen, state.instanceId, fetchQRCodeFromSupabase]);

  const openModal = useCallback((instanceId: string) => {
    console.log('[useQRCodeModal] 🚀 Abrindo modal para instância:', instanceId);
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
