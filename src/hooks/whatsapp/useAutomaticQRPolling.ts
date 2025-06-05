
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

  const maxAttempts = 20; // Total de tentativas

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
    console.log('[Auto QR Polling] 🚀 Iniciando polling OTIMIZADO para:', instanceName);
    console.log('[Auto QR Polling] 📋 Instance ID usado:', instanceId);
    setIsPolling(true);
    setCurrentAttempt(0);

    let attempt = 0;

    const pollForQR = async () => {
      attempt++;
      setCurrentAttempt(attempt);
      console.log(`[Auto QR Polling] 📱 Tentativa RÁPIDA ${attempt}/${maxAttempts} para ${instanceName}`);

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

        console.log(`[Auto QR Polling] 📥 Resposta OTIMIZADA (tentativa ${attempt}):`, {
          success: data.success,
          hasQrCode: !!data.qrCode,
          waiting: data.waiting,
          error: data.error
        });

        if (data.success && data.qrCode) {
          console.log('[Auto QR Polling] ✅ QR Code encontrado RAPIDAMENTE! Parando polling.');
          setIsPolling(false);
          setCurrentAttempt(0);
          onQRCodeFound(data.qrCode);
          return;
        }

        if (data.waiting && attempt < maxAttempts) {
          // OTIMIZAÇÃO: Polling agressivo nas primeiras 10 tentativas (2s), depois normal (3s)
          const delay = attempt <= 10 ? 2000 : 3000;
          console.log(`[Auto QR Polling] ⏳ POLLING RÁPIDO - Aguardando ${delay/1000}s para próxima tentativa...`);
          
          const timeoutId = setTimeout(pollForQR, delay);
          setPollingTimeoutId(timeoutId);
        } else if (attempt >= maxAttempts) {
          console.log('[Auto QR Polling] ⏰ Timeout atingido - parando polling otimizado');
          setIsPolling(false);
          setCurrentAttempt(0);
          toast.warning('QR Code demorou mais que o esperado. Tente atualizar manualmente.');
        }

      } catch (error: any) {
        console.error('[Auto QR Polling] ❌ Erro:', error);
        
        if (attempt < maxAttempts) {
          // OTIMIZAÇÃO: Retry mais rápido em caso de erro - 1.5s ao invés de 3s
          const retryDelay = 1500;
          console.log(`[Auto QR Polling] 🔄 Retry RÁPIDO em ${retryDelay/1000}s...`);
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
