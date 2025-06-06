
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutomaticQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [maxAttempts] = useState(12); // Reduzido para ser mais rápido
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    console.log('[Auto QR Polling] 🛑 Parando polling');
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
    setCurrentAttempt(0);
    isPollingRef.current = false;
  }, []);

  const startPolling = useCallback(async (
    instanceId: string,
    instanceName: string,
    onQRReceived: (qrCode: string) => void
  ) => {
    console.log('[Auto QR Polling] 🚀 Iniciando polling ULTRA-RÁPIDO para:', instanceName);
    
    // Parar qualquer polling anterior
    stopPolling();
    
    setIsPolling(true);
    setCurrentAttempt(0);
    isPollingRef.current = true;

    const poll = async (attempt: number) => {
      if (!isPollingRef.current || attempt > maxAttempts) {
        console.log('[Auto QR Polling] ⏰ Polling finalizado - máximo de tentativas atingido');
        stopPolling();
        toast.error(`Timeout: QR Code não foi gerado após ${maxAttempts} tentativas`);
        return;
      }

      try {
        console.log(`[Auto QR Polling] ⚡ Tentativa ULTRA-RÁPIDA ${attempt}/${maxAttempts} para ${instanceName}`);
        setCurrentAttempt(attempt);

        const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_qr_code_async',
            instanceData: { instanceId }
          }
        });

        if (error) {
          console.error(`[Auto QR Polling] ❌ Erro Supabase:`, error);
          throw error;
        }

        console.log(`[Auto QR Polling] 📥 Resposta ULTRA-RÁPIDA (tentativa ${attempt}):`, {
          success: data.success,
          hasQrCode: !!data.qrCode,
          waiting: data.waiting,
          error: data.error
        });

        if (data.success && data.qrCode) {
          console.log(`[Auto QR Polling] 🎉 QR Code recebido na tentativa ${attempt}!`);
          onQRReceived(data.qrCode);
          stopPolling();
          return;
        }

        if (data.waiting) {
          // Intervalos progressivos mais rápidos: 1.5s -> 2s -> 2.5s
          let delay = 1500; // 1.5 segundos iniciais
          if (attempt > 3) delay = 2000; // 2 segundos após 3 tentativas
          if (attempt > 6) delay = 2500; // 2.5 segundos após 6 tentativas

          console.log(`[Auto QR Polling] ⏳ POLLING ULTRA-RÁPIDO - Aguardando ${delay/1000}s para próxima tentativa...`);
          
          pollingRef.current = setTimeout(() => {
            if (isPollingRef.current) {
              poll(attempt + 1);
            }
          }, delay);
        } else {
          throw new Error(data.error || 'Falha desconhecida ao obter QR Code');
        }

      } catch (error: any) {
        console.error(`[Auto QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
        
        if (attempt >= maxAttempts) {
          stopPolling();
          toast.error(`Erro persistente após ${maxAttempts} tentativas: ${error.message}`);
        } else {
          // Retry mais rápido em caso de erro
          console.log(`[Auto QR Polling] 🔄 Retry em 2s devido a erro...`);
          pollingRef.current = setTimeout(() => {
            if (isPollingRef.current) {
              poll(attempt + 1);
            }
          }, 2000);
        }
      }
    };

    // Iniciar primeira tentativa imediatamente
    await poll(1);

  }, [maxAttempts, stopPolling]);

  return {
    isPolling,
    currentAttempt,
    maxAttempts,
    startPolling,
    stopPolling
  };
};
