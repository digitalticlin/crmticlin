
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutomaticQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [maxAttempts] = useState(15); // FASE 1.2: Aumentado para 15 tentativas
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    console.log('[Auto QR Polling] 🛑 FASE 1.2 - Parando polling');
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
    console.log('[Auto QR Polling] 🚀 FASE 1.2 - Iniciando polling otimizado para:', instanceName);
    
    // Parar qualquer polling anterior
    stopPolling();
    
    setIsPolling(true);
    setCurrentAttempt(0);
    isPollingRef.current = true;

    const poll = async (attempt: number) => {
      if (!isPollingRef.current || attempt > maxAttempts) {
        console.log('[Auto QR Polling] ⏰ FASE 1.2 - Polling finalizado - máximo de tentativas atingido');
        stopPolling();
        toast.error(`Timeout: QR Code não foi gerado após ${maxAttempts} tentativas`);
        return;
      }

      try {
        console.log(`[Auto QR Polling] ⚡ FASE 1.2 - Tentativa ${attempt}/${maxAttempts} para ${instanceName}`);
        setCurrentAttempt(attempt);

        const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_qr_code_async',
            instanceData: { instanceId }
          }
        });

        if (error) {
          console.error(`[Auto QR Polling] ❌ FASE 1.2 - Erro Supabase:`, error);
          throw error;
        }

        console.log(`[Auto QR Polling] 📥 FASE 1.2 - Resposta (tentativa ${attempt}):`, {
          success: data.success,
          hasQrCode: !!data.qrCode,
          waiting: data.waiting,
          source: data.source,
          error: data.error
        });

        if (data.success && data.qrCode) {
          console.log(`[Auto QR Polling] 🎉 FASE 1.2 - QR Code recebido na tentativa ${attempt}! Fonte: ${data.source}`);
          onQRReceived(data.qrCode);
          stopPolling();
          return;
        }

        if (data.waiting) {
          // FASE 1.2: Intervalos otimizados baseados no retryAfter da resposta
          let delay = data.retryAfter || 2000; // Usar sugestão da API ou 2s padrão
          
          // Intervalos progressivos para casos sem sugestão
          if (!data.retryAfter) {
            if (attempt <= 3) delay = 1500;      // 1.5s primeiras 3 tentativas
            else if (attempt <= 8) delay = 2500; // 2.5s tentativas 4-8
            else delay = 3000;                   // 3s tentativas finais
          }

          console.log(`[Auto QR Polling] ⏳ FASE 1.2 - Aguardando ${delay/1000}s para próxima tentativa...`);
          
          pollingRef.current = setTimeout(() => {
            if (isPollingRef.current) {
              poll(attempt + 1);
            }
          }, delay);
        } else {
          throw new Error(data.error || 'Falha desconhecida ao obter QR Code');
        }

      } catch (error: any) {
        console.error(`[Auto QR Polling] ❌ FASE 1.2 - Erro na tentativa ${attempt}:`, error);
        
        if (attempt >= maxAttempts) {
          stopPolling();
          toast.error(`Erro persistente após ${maxAttempts} tentativas: ${error.message}`);
        } else {
          // FASE 1.2: Retry mais rápido em caso de erro
          console.log(`[Auto QR Polling] 🔄 FASE 1.2 - Retry em 2s devido a erro...`);
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
