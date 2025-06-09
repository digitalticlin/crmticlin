
import { useState, useCallback, useRef } from 'react';
import { AutoQRPolling } from '@/components/settings/whatsapp/connection/AutoQRPolling';

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

  const pollingRef = useRef<AutoQRPolling | null>(null);

  const startPolling = useCallback(async (instanceId: string, options: PollingOptions = {}) => {
    console.log(`[Intelligent QR Polling] 🚀 CORREÇÃO: Iniciando polling inteligente para VPS corrigida: ${instanceId}`);
    
    // Reset state
    setIsPolling(true);
    setCurrentAttempt(0);
    setQrCode(null);
    setError(null);
    setTimedOut(false);
    setIsWaiting(true);

    const {
      maxAttempts = 8,
      progressCallback,
      successCallback,
      errorCallback,
      timeoutCallback
    } = options;

    // Stop previous polling if exists
    if (pollingRef.current) {
      pollingRef.current.stop('novo polling iniciado');
    }

    // Create new polling instance
    pollingRef.current = new AutoQRPolling(
      instanceId,
      maxAttempts,
      (qrCodeData: string) => {
        console.log(`[Intelligent QR Polling] ✅ QR Code recebido!`);
        setQrCode(qrCodeData);
        setIsPolling(false);
        setIsWaiting(false);
        successCallback?.(qrCodeData);
      },
      (errorMsg: string) => {
        console.log(`[Intelligent QR Polling] ❌ Erro:`, errorMsg);
        setError(errorMsg);
        setIsPolling(false);
        setIsWaiting(false);
        errorCallback?.(errorMsg);
      },
      (current: number, max: number) => {
        console.log(`[Intelligent QR Polling] 📊 Progresso: ${current}/${max}`);
        setCurrentAttempt(current);
        setIsWaiting(false); // Não está mais aguardando, está tentando ativamente
        progressCallback?.(current, max);
      },
      () => {
        console.log(`[Intelligent QR Polling] ⏰ Timeout!`);
        setTimedOut(true);
        setIsPolling(false);
        setIsWaiting(false);
        timeoutCallback?.();
      }
    );

    // Start polling
    await pollingRef.current.start();
  }, []);

  const stopPolling = useCallback((reason: string = 'manual') => {
    console.log(`[Intelligent QR Polling] 🛑 Parando polling: ${reason}`);
    
    if (pollingRef.current) {
      pollingRef.current.stop(reason);
      pollingRef.current = null;
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
