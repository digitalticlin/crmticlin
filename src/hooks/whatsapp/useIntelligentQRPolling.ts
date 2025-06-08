
import { useState, useCallback, useRef } from 'react';
import { QRCodeService } from '@/services/whatsapp/qrCodeService';
import { toast } from 'sonner';

interface QRPollingConfig {
  maxAttempts: number;
  timeoutMs: number;
  intervalMs: number;
  initialDelayMs?: number;
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
  isWaiting: boolean;
}

export const useIntelligentQRPolling = () => {
  const [state, setState] = useState<QRPollingState>({
    isPolling: false,
    currentAttempt: 0,
    qrCode: null,
    error: null,
    timedOut: false,
    isWaiting: false
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null);
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
    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }
  }, []);

  const stopPolling = useCallback((reason?: string) => {
    console.log(`[Intelligent QR Polling] 🛑 Parando polling${reason ? `: ${reason}` : ''}`);
    cleanup();
    setState(prev => ({ ...prev, isPolling: false, isWaiting: false }));
  }, [cleanup]);

  const attemptQRFetch = async (instanceId: string, config: QRPollingConfig) => {
    setState(prev => {
      const newAttempt = prev.currentAttempt + 1;
      console.log(`[Intelligent QR Polling] 📱 Tentativa ${newAttempt}/${config.maxAttempts} para ${instanceId}`);
      
      config.progressCallback?.(newAttempt, config.maxAttempts);
      
      return { ...prev, currentAttempt: newAttempt };
    });

    const currentAttempt = state.currentAttempt + 1;

    try {
      const result = await QRCodeService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log(`[Intelligent QR Polling] ✅ QR Code obtido na tentativa ${currentAttempt}!`);
        setState(prev => ({ 
          ...prev, 
          qrCode: result.qrCode!, 
          isPolling: false,
          isWaiting: false
        }));
        stopPolling('QR Code obtido com sucesso');
        config.successCallback?.(result.qrCode);
        toast.success('QR Code gerado com sucesso!');
        return;
      }

      if (result.waiting) {
        console.log(`[Intelligent QR Polling] ⏳ QR Code ainda sendo gerado (tentativa ${currentAttempt})`);
        
        if (currentAttempt >= config.maxAttempts) {
          console.log(`[Intelligent QR Polling] ❌ Máximo de tentativas atingido (${currentAttempt}/${config.maxAttempts})`);
          stopPolling('máximo de tentativas');
          setState(prev => ({ ...prev, error: 'QR Code não foi gerado após várias tentativas', isWaiting: false }));
          config.errorCallback?.('Máximo de tentativas atingido');
          toast.warning('QR Code não foi gerado. Tente novamente em alguns minutos.');
        }
        return;
      }

      // Erro específico
      throw new Error(result.error || 'Falha ao obter QR Code');

    } catch (error: any) {
      console.error(`[Intelligent QR Polling] ❌ Erro na tentativa ${currentAttempt}:`, error);
      
      if (currentAttempt >= config.maxAttempts) {
        stopPolling('erro após máximo de tentativas');
        setState(prev => ({ ...prev, error: error.message, isWaiting: false }));
        config.errorCallback?.(error.message);
        toast.error(`Erro após ${currentAttempt} tentativas: ${error.message}`);
      }
    }
  };

  const startActualPolling = useCallback(async (instanceId: string, config: QRPollingConfig) => {
    console.log(`[Intelligent QR Polling] 🚀 Iniciando polling real para: ${instanceId}`);
    
    setState(prev => ({ ...prev, isWaiting: false, isPolling: true }));

    // SAFEGUARD: Timeout absoluto obrigatório
    timeoutRef.current = setTimeout(() => {
      console.log(`[Intelligent QR Polling] ⏰ TIMEOUT após ${config.timeoutMs}ms`);
      stopPolling('timeout absoluto');
      setState(prev => ({ ...prev, timedOut: true, error: 'Timeout: QR Code não foi gerado em 2 minutos', isWaiting: false }));
      config.timeoutCallback?.();
      toast.warning('Timeout: Tente gerar o QR Code novamente');
    }, config.timeoutMs);

    // Primeira tentativa imediata
    await attemptQRFetch(instanceId, config);

    // Continuar polling se necessário
    if (state.isPolling && state.currentAttempt < config.maxAttempts) {
      pollingRef.current = setInterval(async () => {
        await attemptQRFetch(instanceId, config);
      }, config.intervalMs);
    }
  }, [state.isPolling, state.currentAttempt, stopPolling]);

  const startPolling = useCallback(async (
    instanceId: string, 
    config: Partial<QRPollingConfig> = {}
  ) => {
    const finalConfig: QRPollingConfig = {
      maxAttempts: 8,
      timeoutMs: 120000, // 2 minutos MÁXIMO
      intervalMs: 4000,  // 4 segundos entre tentativas
      initialDelayMs: 4000, // 4 segundos de delay inicial
      ...config
    };

    configRef.current = finalConfig;
    instanceIdRef.current = instanceId;

    console.log(`[Intelligent QR Polling] 🚀 Iniciando fluxo com delay para: ${instanceId}`, {
      maxAttempts: finalConfig.maxAttempts,
      timeoutMs: finalConfig.timeoutMs,
      intervalMs: finalConfig.intervalMs,
      initialDelayMs: finalConfig.initialDelayMs
    });

    // Reset state
    setState({
      isPolling: false,
      currentAttempt: 0,
      qrCode: null,
      error: null,
      timedOut: false,
      isWaiting: true
    });

    // DELAY INTELIGENTE: Aguardar VPS processar a criação da instância
    console.log(`[Intelligent QR Polling] ⏳ Aguardando ${finalConfig.initialDelayMs}ms para VPS processar...`);
    
    initialDelayRef.current = setTimeout(() => {
      console.log(`[Intelligent QR Polling] ✅ Delay concluído, iniciando polling real`);
      startActualPolling(instanceId, finalConfig);
    }, finalConfig.initialDelayMs);

  }, [startActualPolling]);

  const reset = useCallback(() => {
    cleanup();
    setState({
      isPolling: false,
      currentAttempt: 0,
      qrCode: null,
      error: null,
      timedOut: false,
      isWaiting: false
    });
  }, [cleanup]);

  return {
    ...state,
    startPolling,
    stopPolling,
    reset
  };
};
