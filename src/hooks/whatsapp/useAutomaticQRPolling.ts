
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoQRPollingHook {
  isPolling: boolean;
  startPolling: (instanceId: string, instanceName: string, onQRCodeFound: (qrCode: string) => void) => Promise<void>;
  stopPolling: () => void;
}

export const useAutomaticQRPolling = (): AutoQRPollingHook => {
  const [isPolling, setIsPolling] = useState(false);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      setPollingTimeoutId(null);
    }
    setIsPolling(false);
  }, [pollingTimeoutId]);

  const startPolling = useCallback(async (
    instanceId: string, 
    instanceName: string,
    onQRCodeFound: (qrCode: string) => void
  ) => {
    console.log('[Auto QR Polling] 🚀 Iniciando polling otimizado para:', instanceName);
    console.log('[Auto QR Polling] 📋 Instance ID usado:', instanceId);
    setIsPolling(true);

    const maxAttempts = 20; // Mais tentativas
    const baseDelay = 5000; // 5 segundos base
    let attempt = 0;

    const pollForQR = async () => {
      attempt++;
      console.log(`[Auto QR Polling] 📱 Tentativa ${attempt}/${maxAttempts} para ${instanceName}`);

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

        console.log(`[Auto QR Polling] 📥 Resposta (tentativa ${attempt}):`, {
          success: data.success,
          hasQrCode: !!data.qrCode,
          waiting: data.waiting,
          error: data.error
        });

        if (data.success && data.qrCode) {
          console.log('[Auto QR Polling] ✅ QR Code encontrado! Parando polling.');
          setIsPolling(false);
          onQRCodeFound(data.qrCode);
          return;
        }

        if (data.waiting && attempt < maxAttempts) {
          const delay = data.retryAfter || baseDelay;
          console.log(`[Auto QR Polling] ⏳ Aguardando ${delay/1000}s para próxima tentativa...`);
          
          const timeoutId = setTimeout(pollForQR, delay);
          setPollingTimeoutId(timeoutId);
        } else if (attempt >= maxAttempts) {
          console.log('[Auto QR Polling] ⏰ Timeout atingido - parando polling');
          setIsPolling(false);
          toast.warning('QR Code demorou mais que o esperado. Tente atualizar manualmente.');
        }

      } catch (error: any) {
        console.error('[Auto QR Polling] ❌ Erro:', error);
        
        if (attempt < maxAttempts) {
          // Retry mais rápido em caso de erro
          const retryDelay = Math.min(baseDelay, 3000);
          console.log(`[Auto QR Polling] 🔄 Retry em ${retryDelay/1000}s...`);
          const timeoutId = setTimeout(pollForQR, retryDelay);
          setPollingTimeoutId(timeoutId);
        } else {
          setIsPolling(false);
          toast.error('Erro ao obter QR Code. Tente novamente.');
        }
      }
    };

    // Iniciar polling imediatamente
    await pollForQR();
  }, []);

  return {
    isPolling,
    startPolling,
    stopPolling
  };
};
