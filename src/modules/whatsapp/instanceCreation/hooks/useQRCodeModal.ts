
import { useState, useEffect, useCallback, useRef } from 'react';
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

  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  // Limpar estado ao fechar
  const closeModal = useCallback(() => {
    console.log('[useQRCodeModal] 🔒 Fechando modal');
    setState(prev => ({
      ...prev,
      isOpen: false,
      qrCode: null,
      error: null,
      isLoading: false
    }));
  }, []);

  // Cleanup function
  const cleanupSubscription = useCallback(() => {
    if (channelRef.current && isSubscribedRef.current) {
      console.log('[useQRCodeModal] 🧹 Removendo subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
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
    if (!state.instanceId || !state.isOpen) {
      return;
    }

    // Cleanup existing subscription before creating new one
    cleanupSubscription();

    console.log('[useQRCodeModal] 🔄 Configurando subscription para:', state.instanceId);

    try {
      channelRef.current = supabase
        .channel(`instance_${state.instanceId}_${Date.now()}`) // Add timestamp to ensure unique channel names
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `id=eq.${state.instanceId}`
        }, (payload) => {
          console.log('[useQRCodeModal] 🔄 Atualização em tempo real:', payload.new);
          
          const newData = payload.new as any;
          
          // Se QR Code foi atualizado
          if (newData.qr_code && newData.qr_code !== state.qrCode && newData.qr_code !== 'waiting') {
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
        });

      channelRef.current.subscribe((status: string) => {
        console.log('[useQRCodeModal] 📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          isSubscribedRef.current = false;
        }
      });

    } catch (error) {
      console.error('[useQRCodeModal] ❌ Erro ao configurar subscription:', error);
    }

    return cleanupSubscription;
  }, [state.instanceId, state.isOpen, state.qrCode, closeModal, cleanupSubscription]);

  // Buscar QR Code quando modal abrir
  useEffect(() => {
    if (state.isOpen && state.instanceId) {
      fetchQRCodeFromSupabase(state.instanceId);
    }
  }, [state.isOpen, state.instanceId, fetchQRCodeFromSupabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  const openModal = useCallback((instanceId: string) => {
    console.log('[useQRCodeModal] 🚀 Abrindo modal para instância:', instanceId);
    
    // Reset state completely before opening
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
