import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QRPollingState {
  isPolling: boolean;
  currentAttempt: number;
  maxAttempts: number;
  qrCode: string | null;
  error: string | null;
  isWaitingForGeneration: boolean;
  status: 'idle' | 'polling' | 'success' | 'error' | 'timeout';
}

interface QRPollingOptions {
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
  onSuccess?: (qrCode: string) => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
  onProgress?: (attempt: number, maxAttempts: number) => void;
  onConnected?: () => void; // NOVO: Callback para quando conectar
}

export const useAutoQRPolling = (options: QRPollingOptions = {}) => {
  const [state, setState] = useState<QRPollingState>({
    isPolling: false,
    currentAttempt: 0,
    maxAttempts: options.maxAttempts || 15,
    qrCode: null,
    error: null,
    isWaitingForGeneration: false,
    status: 'idle'
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const {
    maxAttempts = 15,
    intervalMs = 3000,
    timeoutMs = 45000,
    onSuccess,
    onError,
    onTimeout,
    onProgress,
    onConnected
  } = options;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (realtimeRef.current) {
      realtimeRef.current.unsubscribe();
      realtimeRef.current = null;
    }
  }, []);

  // Validate QR Code
  const isValidQRCode = useCallback((qrCode: string | null): boolean => {
    if (!qrCode || typeof qrCode !== 'string') return false;
    
    // Check if it's a valid data URL or base64
    return (
      qrCode.includes('data:image/') || 
      qrCode.includes('base64,') || 
      (qrCode.length > 100 && !!qrCode.match(/^[A-Za-z0-9+/=]+$/))
    );
  }, []);

  // Setup realtime subscription
  const setupRealtime = useCallback((instanceId: string) => {
    console.log('[AutoQRPolling] 📡 Configurando Realtime para:', instanceId);
    
    // Cleanup previous subscription
    if (realtimeRef.current) {
      realtimeRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`qr_polling_${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `id=eq.${instanceId}`
        },
        (payload) => {
          console.log('[AutoQRPolling] 📱 Realtime update:', payload.new);
          
          const newData = payload.new;
          
          // Check if QR Code is available
          if (newData.qr_code && isValidQRCode(newData.qr_code)) {
            console.log('[AutoQRPolling] ✅ QR Code recebido via Realtime!');
            
            setState(prev => ({
              ...prev,
              qrCode: newData.qr_code,
              isPolling: false,
              status: 'success',
              error: null
            }));
            
            cleanup();
            onSuccess?.(newData.qr_code);
            toast.success('QR Code gerado com sucesso!');
          }
          
          // CORREÇÃO: Check if connected (stop polling) com múltiplos status
          const connectedStatuses = ['connected', 'ready', 'open'];
          if (connectedStatuses.includes(newData.connection_status?.toLowerCase())) {
            console.log('[AutoQRPolling] 🎉 Instância conectada!', {
              status: newData.connection_status,
              phone: newData.phone,
              profileName: newData.profile_name
            });
            
            setState(prev => ({
              ...prev,
              isPolling: false,
              status: 'success',
              error: null
            }));
            
            cleanup();
            onConnected?.(); // CORREÇÃO: Chamar callback de conexão
            
            const phoneInfo = newData.phone ? ` 📱 ${newData.phone}` : '';
            const profileInfo = newData.profile_name ? ` (${newData.profile_name})` : '';
            toast.success(`WhatsApp conectado com sucesso!${phoneInfo}${profileInfo}`);
          }
        }
      )
      .subscribe();

    realtimeRef.current = channel;
  }, [cleanup, isValidQRCode, onSuccess]);

  // Database polling function
  const pollDatabase = useCallback(async (instanceId: string) => {
    if (!isMountedRef.current) return;

    try {
      console.log(`[AutoQRPolling] 🔍 Polling tentativa ${state.currentAttempt + 1}/${maxAttempts}`);
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, instance_name, phone, profile_name')
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('[AutoQRPolling] ❌ Erro ao buscar instância:', error);
        return;
      }

      if (!data) {
        console.warn('[AutoQRPolling] ⚠️ Instância não encontrada');
        return;
      }

      console.log('[AutoQRPolling] 📊 Status da instância:', {
        hasQrCode: !!data.qr_code,
        connectionStatus: data.connection_status,
        instanceName: data.instance_name
      });

      // CORREÇÃO: Check if already connected com múltiplos status
      const connectedStatuses = ['connected', 'ready', 'open'];
      if (connectedStatuses.includes(data.connection_status?.toLowerCase())) {
        console.log('[AutoQRPolling] 🎉 Instância já conectada!', {
          status: data.connection_status,
          phone: data.phone,
          profileName: data.profile_name
        });
        
        setState(prev => ({
          ...prev,
          isPolling: false,
          status: 'success',
          error: null
        }));
        
        cleanup();
        onConnected?.(); // CORREÇÃO: Chamar callback de conexão
        
        const phoneInfo = data.phone ? ` 📱 ${data.phone}` : '';
        const profileInfo = data.profile_name ? ` (${data.profile_name})` : '';
        toast.success(`WhatsApp já está conectado!${phoneInfo}${profileInfo}`);
        return;
      }

      // Check if QR Code is available
      if (data.qr_code && isValidQRCode(data.qr_code)) {
        console.log('[AutoQRPolling] ✅ QR Code encontrado!');
        
        setState(prev => ({
          ...prev,
          qrCode: data.qr_code,
          isPolling: false,
          status: 'success',
          error: null
        }));
        
        cleanup();
        onSuccess?.(data.qr_code);
        toast.success('QR Code carregado com sucesso!');
        return;
      }

      // Update attempt counter
      setState(prev => {
        const newAttempt = prev.currentAttempt + 1;
        onProgress?.(newAttempt, maxAttempts);
        
        return {
          ...prev,
          currentAttempt: newAttempt,
          isWaitingForGeneration: true
        };
      });

    } catch (error: any) {
      console.error('[AutoQRPolling] ❌ Erro no polling:', error);
    }
  }, [state.currentAttempt, maxAttempts, isValidQRCode, cleanup, onSuccess, onProgress]);

  // Start polling
  const startPolling = useCallback((instanceId: string) => {
    console.log('[AutoQRPolling] 🚀 Iniciando polling para:', instanceId);
    
    if (state.isPolling) {
      console.log('[AutoQRPolling] ⚠️ Polling já está ativo');
      return;
    }

    // Reset state
    setState({
      isPolling: true,
      currentAttempt: 0,
      maxAttempts,
      qrCode: null,
      error: null,
      isWaitingForGeneration: true,
      status: 'polling'
    });

    // Setup realtime subscription
    setupRealtime(instanceId);

    // Start polling
    pollingRef.current = setInterval(() => {
      pollDatabase(instanceId);
    }, intervalMs);

    // First poll immediately
    pollDatabase(instanceId);

    // Global timeout
    setTimeout(() => {
      if (state.isPolling) {
        console.log('[AutoQRPolling] ⏰ Timeout global atingido');
        
        setState(prev => ({
          ...prev,
          isPolling: false,
          status: 'timeout',
          error: 'Timeout: QR Code não foi gerado no tempo esperado'
        }));
        
        cleanup();
        onTimeout?.();
        toast.error('Timeout: QR Code não foi gerado. Tente novamente.');
      }
    }, timeoutMs);

  }, [state.isPolling, maxAttempts, setupRealtime, pollDatabase, intervalMs, timeoutMs, onTimeout]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('[AutoQRPolling] 🛑 Parando polling');
    
    setState(prev => ({
      ...prev,
      isPolling: false,
      status: 'idle'
    }));
    
    cleanup();
  }, [cleanup]);

  // Reset state
  const reset = useCallback(() => {
    console.log('[AutoQRPolling] 🔄 Resetando estado');
    
    cleanup();
    setState({
      isPolling: false,
      currentAttempt: 0,
      maxAttempts,
      qrCode: null,
      error: null,
      isWaitingForGeneration: false,
      status: 'idle'
    });
  }, [cleanup, maxAttempts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startPolling,
    stopPolling,
    reset,
    progressPercentage: Math.round((state.currentAttempt / maxAttempts) * 100)
  };
}; 