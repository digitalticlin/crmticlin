
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoQRPollingHook {
  isPolling: boolean;
  currentAttempt: number;
  maxAttempts: number;
  startPolling: (instanceId: string, instanceName: string, onQRCodeFound: (qrCode: string) => void) => Promise<void>;
  stopPolling: () => void;
}

export const useAutomaticQRPolling = (): AutoQRPollingHook => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const maxAttempts = 12; // Reduzido de 20 para 12 tentativas

  const stopPolling = useCallback(() => {
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }
    setIsPolling(false);
    setCurrentAttempt(0);
  }, [pollingTimeoutId]);

  const startPolling = useCallback(async (
    instanceId: string, 
    instanceName: string,
    onQRCodeFound: (qrCode: string) => void
  ) => {
    console.log('[Auto QR Polling] 🚀 Iniciando polling ULTRA-RÁPIDO para:', instanceName);
    console.log('[Auto QR Polling] 📋 Instance ID usado:', instanceId);
    setIsPolling(true);
    setCurrentAttempt(0);

    let attempt = 0;

    const pollForQR = async () => {
      attempt++;
      setCurrentAttempt(attempt);
      console.log(`[Auto QR Polling] ⚡ Tentativa ULTRA-RÁPIDA ${attempt}/${maxAttempts} para ${instanceName}`);

      try {
        const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_qr_code_async',
            instanceData: { 
              instanceId: instanceId
            }
          }
        });

        if (error) {
          console.error('[Auto QR Polling] ❌ Erro na requisição:', error);
          throw new Error(error.message);
        }

        console.log(`[Auto QR Polling] 📥 Resposta ULTRA-RÁPIDA (tentativa ${attempt}):`, {
          success: data.success,
          hasQrCode: !!data.qrCode,
          waiting: data.waiting,
          error: data.error
        });

        if (data.success && data.qrCode) {
          console.log('[Auto QR Polling] ✅ QR Code encontrado ULTRA-RAPIDAMENTE! Parando polling.');
          setIsPolling(false);
          setCurrentAttempt(0);
          onQRCodeFound(data.qrCode);
          return;
        }

        if (data.waiting && attempt < maxAttempts) {
          // OTIMIZAÇÃO ULTRA-RÁPIDA: Polling agressivo progressivo
          let delay;
          if (attempt <= 3) {
            delay = 1500; // Primeiras 3 tentativas: 1.5s
          } else if (attempt <= 6) {
            delay = 2000; // Tentativas 4-6: 2s
          } else {
            delay = 2500; // Últimas tentativas: 2.5s
          }
          
          console.log(`[Auto QR Polling] ⏳ POLLING ULTRA-RÁPIDO - Aguardando ${delay/1000}s para próxima tentativa...`);
          
          const timeoutId = setTimeout(pollForQR, delay);
          setPollingTimeoutId(timeoutId);
        } else if (attempt >= maxAttempts) {
          console.log('[Auto QR Polling] ⏰ Timeout ULTRA-RÁPIDO após', maxAttempts, 'tentativas - parando polling');
          setIsPolling(false);
          setCurrentAttempt(0);
          toast.warning('QR Code demorou mais que o esperado. Tente atualizar manualmente.');
        }

      } catch (error: any) {
        console.error('[Auto QR Polling] ❌ Erro:', error);
        
        if (attempt < maxAttempts) {
          // OTIMIZAÇÃO: Retry ainda mais rápido em caso de erro - 1s
          const retryDelay = 1000;
          console.log(`[Auto QR Polling] 🔄 Retry ULTRA-RÁPIDO em ${retryDelay/1000}s...`);
          const timeoutId = setTimeout(pollForQR, retryDelay);
          setPollingTimeoutId(timeoutId);
        } else {
          setIsPolling(false);
          setCurrentAttempt(0);
          toast.error('Erro ao obter QR Code. Tente novamente.');
        }
      }
    };

    // OTIMIZAÇÃO: Iniciar polling imediatamente (sem delay inicial)
    await pollForQR();
  }, [maxAttempts]);

  return {
    isPolling,
    currentAttempt,
    maxAttempts,
    startPolling,
    stopPolling
  };
};
