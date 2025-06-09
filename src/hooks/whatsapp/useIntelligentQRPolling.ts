
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PollingOptions {
  maxAttempts?: number;
  timeoutMs?: number;
  intervalMs?: number;
  initialDelayMs?: number;
  progressCallback?: (current: number, max: number) => void;
  successCallback?: (qrCode: string) => void;
  errorCallback?: (error: string) => void;
  timeoutCallback?: () => void;
}

export const useIntelligentQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // CORREÇÃO: Polling otimizado com QR service
  const startPolling = useCallback(async (instanceId: string, options: PollingOptions = {}) => {
    console.log(`[Intelligent QR Polling] 🚀 CORREÇÃO: Iniciando polling otimizado: ${instanceId}`);
    
    // Reset state
    setIsPolling(true);
    setCurrentAttempt(0);
    setQrCode(null);
    setError(null);
    setTimedOut(false);
    setIsWaiting(true);

    const {
      maxAttempts = 20,
      intervalMs = 3000, // 3 segundos entre tentativas
      timeoutMs = 60000, // 60 segundos timeout total
      progressCallback,
      successCallback,
      errorCallback,
      timeoutCallback
    } = options;

    // Stop previous polling if exists
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    let attempts = 0;

    // Timeout geral
    timeoutRef.current = setTimeout(() => {
      console.log(`[Intelligent QR Polling] ⏰ Timeout geral (${timeoutMs}ms)`);
      setTimedOut(true);
      setIsPolling(false);
      setIsWaiting(false);
      timeoutCallback?.();
      
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }, timeoutMs);

    // Polling interval
    pollingRef.current = setInterval(async () => {
      attempts++;
      console.log(`[Intelligent QR Polling] 📱 Tentativa ${attempts}/${maxAttempts} para: ${instanceId}`);
      
      setCurrentAttempt(attempts);
      setIsWaiting(false); // Não está mais aguardando, está tentando ativamente
      progressCallback?.(attempts, maxAttempts);

      try {
        // CORREÇÃO: Usar QR service otimizado
        const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
          body: {
            action: 'get_qr_code_v3',
            instanceId: instanceId
          }
        });

        console.log(`[Intelligent QR Polling] 📡 Resposta tentativa ${attempts}:`, {
          success: data?.success,
          hasQrCode: !!(data?.qrCode),
          source: data?.source,
          waiting: data?.waiting,
          error: data?.error || error?.message
        });

        if (data?.success && data.qrCode) {
          // QR Code encontrado!
          console.log(`[Intelligent QR Polling] ✅ QR Code encontrado na tentativa ${attempts}!`);
          setQrCode(data.qrCode);
          setIsPolling(false);
          setIsWaiting(false);
          successCallback?.(data.qrCode);
          
          // Limpar intervals
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
        }

        if (data?.waiting) {
          console.log(`[Intelligent QR Polling] ⏳ Tentativa ${attempts}: QR ainda sendo gerado`);
          // Continuar polling
          return;
        }

        if (data?.error || error) {
          console.log(`[Intelligent QR Polling] ❌ Erro na tentativa ${attempts}:`, data?.error || error?.message);
        }

      } catch (pollError: any) {
        console.error(`[Intelligent QR Polling] ❌ Erro na tentativa ${attempts}:`, pollError);
      }

      // Verificar se atingiu máximo de tentativas
      if (attempts >= maxAttempts) {
        console.log(`[Intelligent QR Polling] ⏰ Máximo de tentativas atingido (${maxAttempts})`);
        setIsPolling(false);
        setIsWaiting(false);
        setError('Timeout: QR Code não foi gerado após múltiplas tentativas');
        errorCallback?.('Timeout: QR Code não foi gerado após múltiplas tentativas');
        
        // Limpar intervals
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }, intervalMs);

  }, []);

  const stopPolling = useCallback((reason: string = 'manual') => {
    console.log(`[Intelligent QR Polling] 🛑 Parando polling: ${reason}`);
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsPolling(false);
    setIsWaiting(false);
  }, []);

  const reset = useCallback(() => {
    console.log(`[Intelligent QR Polling] 🔄 Reset`);
    
    stopPolling('reset');
    setCurrentAttempt(0);
    setQrCode(null);
    setError(null);
    setTimedOut(false);
    setIsWaiting(false);
  }, [stopPolling]);

  return {
    isPolling,
    currentAttempt,
    qrCode,
    error,
    timedOut,
    isWaiting,
    startPolling,
    stopPolling,
    reset
  };
};
