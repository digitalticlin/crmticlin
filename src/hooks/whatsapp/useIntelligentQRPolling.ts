
import { useState, useCallback, useRef } from 'react';
import { QRCodeService } from '@/services/whatsapp/qrCodeService';
import { toast } from 'sonner';

interface QRPollingConfig {
  maxAttempts: number;
  timeoutMs: number;
  intervalMs: number;
  progressCallback?: (current: number, max: number) => void;
  successCallback?: (qrCode: string) => void;
  errorCallback?: (error: string) => void;
  timeoutCallback?: () => void;
}

interface QRPollingState {
  isPolling: boolean;
  currentAttempt: number;
  qrCode: string | null;
  error: string | null;
  timedOut: boolean;
}

export const useIntelligentQRPolling = () => {
  const [state, setState] = useState<QRPollingState>({
    isPolling: false,
    currentAttempt: 0,
    qrCode: null,
    error: null,
    timedOut: false
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef<QRPollingConfig | null>(null);
  const instanceIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopPolling = useCallback((reason?: string) => {
    console.log(`[Intelligent QR Polling] 🛑 Parando polling${reason ? `: ${reason}` : ''}`);
    cleanup();
    setState(prev => ({ ...prev, isPolling: false }));
  }, [cleanup]);

  const startPolling = useCallback(async (
    instanceId: string, 
    config: Partial<QRPollingConfig> = {}
  ) => {
    const finalConfig: QRPollingConfig = {
      maxAttempts: 8,
      timeoutMs: 120000, // 2 minutos MÁXIMO
      intervalMs: 4000,  // 4 segundos entre tentativas
      ...config
    };

    configRef.current = finalConfig;
    instanceIdRef.current = instanceId;

    console.log(`[Intelligent QR Polling] 🚀 Iniciando polling para: ${instanceId}`, {
      maxAttempts: finalConfig.maxAttempts,
      timeoutMs: finalConfig.timeoutMs,
      intervalMs: finalConfig.intervalMs
    });

    // Reset state
    setState({
      isPolling: true,
      currentAttempt: 0,
      qrCode: null,
      error: null,
      timedOut: false
    });

    // SAFEGUARD: Timeout absoluto obrigatório
    timeoutRef.current = setTimeout(() => {
      console.log(`[Intelligent QR Polling] ⏰ TIMEOUT após ${finalConfig.timeoutMs}ms`);
      stopPolling('timeout absoluto');
      setState(prev => ({ ...prev, timedOut: true, error: 'Timeout: QR Code não foi gerado em 2 minutos' }));
      finalConfig.timeoutCallback?.();
      toast.warning('Timeout: Tente gerar o QR Code novamente');
    }, finalConfig.timeoutMs);

    // Primeira tentativa imediata
    await attemptQRFetch(instanceId, finalConfig);

    // Continuar polling se necessário
    if (state.isPolling && state.currentAttempt < finalConfig.maxAttempts) {
      pollingRef.current = setInterval(async () => {
        await attemptQRFetch(instanceId, finalConfig);
      }, finalConfig.intervalMs);
    }
  }, [state.isPolling, state.currentAttempt, stopPolling]);

  const attemptQRFetch = async (instanceId: string, config: QRPollingConfig) => {
    const attempt = state.currentAttempt + 1;
    
    console.log(`[Intelligent QR Polling] 📱 Tentativa ${attempt}/${config.maxAttempts} para ${instanceId}`);
    
    setState(prev => ({ ...prev, currentAttempt: attempt }));
    config.progressCallback?.(attempt, config.maxAttempts);

    try {
      const result = await QRCodeService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log(`[Intelligent QR Polling] ✅ QR Code obtido na tentativa ${attempt}!`);
        setState(prev => ({ 
          ...prev, 
          qrCode: result.qrCode!, 
          isPolling: false 
        }));
        stopPolling('QR Code obtido com sucesso');
        config.successCallback?.(result.qrCode);
        toast.success('QR Code gerado com sucesso!');
        return;
      }

      if (result.waiting) {
        console.log(`[Intelligent QR Polling] ⏳ QR Code ainda sendo gerado (tentativa ${attempt})`);
        
        if (attempt >= config.maxAttempts) {
          console.log(`[Intelligent QR Polling] ❌ Máximo de tentativas atingido (${attempt}/${config.maxAttempts})`);
          stopPolling('máximo de tentativas');
          setState(prev => ({ ...prev, error: 'QR Code não foi gerado após várias tentativas' }));
          config.errorCallback?.('Máximo de tentativas atingido');
          toast.warning('QR Code não foi gerado. Tente novamente em alguns minutos.');
        }
        return;
      }

      // Erro específico
      throw new Error(result.error || 'Falha ao obter QR Code');

    } catch (error: any) {
      console.error(`[Intelligent QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
      
      if (attempt >= config.maxAttempts) {
        stopPolling('erro após máximo de tentativas');
        setState(prev => ({ ...prev, error: error.message }));
        config.errorCallback?.(error.message);
        toast.error(`Erro após ${attempt} tentativas: ${error.message}`);
      }
    }
  };

  const reset = useCallback(() => {
    cleanup();
    setState({
      isPolling: false,
      currentAttempt: 0,
      qrCode: null,
      error: null,
      timedOut: false
    });
  }, [cleanup]);

  return {
    ...state,
    startPolling,
    stopPolling,
    reset
  };
};
