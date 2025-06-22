
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
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function melhorada
  const cleanupSubscription = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (channelRef.current && isSubscribedRef.current) {
      console.log('[useQRCodeModal] 🧹 Removendo subscription existente');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('[useQRCodeModal] ⚠️ Erro ao remover channel:', error);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  }, []);

  // Fechar modal com cleanup
  const closeModal = useCallback(() => {
    console.log('[useQRCodeModal] 🔒 Fechando modal');
    cleanupSubscription();
    setState({
      isOpen: false,
      qrCode: null,
      isLoading: false,
      instanceId: null,
      error: null
    });
  }, [cleanupSubscription]);

  // CORREÇÃO: Função para buscar QR Code com retry automático
  const fetchQRCodeWithRetry = useCallback(async (instanceId: string, attempt = 1, maxAttempts = 8) => {
    try {
      console.log('[useQRCodeModal] 🔍 Tentativa', attempt, 'de', maxAttempts, 'para:', instanceId);
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, instance_name')
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('[useQRCodeModal] ❌ Erro ao buscar dados:', error);
        
        if (attempt < maxAttempts) {
          console.log('[useQRCodeModal] 🔄 Tentando novamente em 2s...');
          retryTimeoutRef.current = setTimeout(() => {
            fetchQRCodeWithRetry(instanceId, attempt + 1, maxAttempts);
          }, 2000);
          return;
        }

        setState(prev => ({
          ...prev,
          error: 'Erro ao carregar dados da instância',
          isLoading: false
        }));
        return;
      }

      console.log('[useQRCodeModal] 📱 Dados encontrados:', { 
        hasQR: !!data.qr_code, 
        status: data.connection_status 
      });

      // Verificar se já está conectado
      if (data.connection_status === 'ready' || data.connection_status === 'connected') {
        console.log('[useQRCodeModal] ✅ Instância já conectada');
        toast.success('WhatsApp já está conectado!');
        closeModal();
        return;
      }

      // Se tem QR Code válido, mostrar
      if (data.qr_code && data.qr_code !== 'waiting' && data.qr_code.startsWith('data:')) {
        console.log('[useQRCodeModal] ✅ QR Code válido encontrado');
        setState(prev => ({
          ...prev,
          qrCode: data.qr_code,
          isLoading: false,
          error: null
        }));
      } else {
        // CORREÇÃO: Se não tem QR Code e ainda há tentativas, continuar tentando
        if (attempt < maxAttempts) {
          console.log('[useQRCodeModal] ⏳ QR Code ainda não disponível, tentando novamente...');
          retryTimeoutRef.current = setTimeout(() => {
            fetchQRCodeWithRetry(instanceId, attempt + 1, maxAttempts);
          }, 2000);
        } else {
          console.log('[useQRCodeModal] ❌ QR Code não disponível após todas as tentativas');
          setState(prev => ({
            ...prev,
            error: 'QR Code não disponível. Tente novamente.',
            isLoading: false
          }));
        }
      }

    } catch (err: any) {
      console.error('[useQRCodeModal] ❌ Erro inesperado:', err);
      
      if (attempt < maxAttempts) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchQRCodeWithRetry(instanceId, attempt + 1, maxAttempts);
        }, 2000);
      } else {
        setState(prev => ({
          ...prev,
          error: err.message,
          isLoading: false
        }));
      }
    }
  }, [closeModal]);

  // Configurar subscription para real-time updates
  useEffect(() => {
    if (!state.instanceId || !state.isOpen) {
      return;
    }

    // Cleanup subscription anterior
    cleanupSubscription();

    console.log('[useQRCodeModal] 🔄 Configurando subscription para:', state.instanceId);

    try {
      const channelName = `qr_modal_${state.instanceId}_${Date.now()}`;
      
      channelRef.current = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `id=eq.${state.instanceId}`
        }, (payload) => {
          console.log('[useQRCodeModal] 🔄 Update em tempo real:', payload.new);
          
          const newData = payload.new as any;
          
          // QR Code atualizado
          if (newData.qr_code && 
              newData.qr_code !== state.qrCode && 
              newData.qr_code !== 'waiting' &&
              newData.qr_code.startsWith('data:')) {
            console.log('[useQRCodeModal] 📱 Novo QR Code via real-time');
            setState(prev => ({
              ...prev,
              qrCode: newData.qr_code,
              isLoading: false,
              error: null
            }));
          }

          // Status de conexão
          if (newData.connection_status === 'ready' || newData.connection_status === 'connected') {
            console.log('[useQRCodeModal] ✅ Conectado via real-time');
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

  // CORREÇÃO: Buscar dados quando modal abrir com delay adequado
  useEffect(() => {
    if (state.isOpen && state.instanceId) {
      // Delay para garantir que o modal seja renderizado e instância esteja no banco
      cleanupTimeoutRef.current = setTimeout(() => {
        fetchQRCodeWithRetry(state.instanceId!);
      }, 300);
    }
  }, [state.isOpen, state.instanceId, fetchQRCodeWithRetry]);

  // Cleanup geral ao desmontar
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  // CORREÇÃO: Abrir modal com garantia de abertura imediata
  const openModal = useCallback((instanceId: string) => {
    console.log('[useQRCodeModal] 🚀 CORREÇÃO DEFINITIVA: Abrindo modal para:', instanceId);
    
    // Fechar qualquer modal anterior
    cleanupSubscription();
    
    // Abrir modal imediatamente
    setState({
      isOpen: true,           // ✅ MODAL ABRE IMEDIATAMENTE
      qrCode: null,
      isLoading: true,        // ✅ Mostra loading
      instanceId,
      error: null
    });
  }, [cleanupSubscription]);

  return {
    ...state,
    openModal,
    closeModal
  };
};
