
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutomaticQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [maxAttempts] = useState(20); // FASE 1.3: Aumentado para 20 tentativas
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    console.log('[Auto QR Polling] 🛑 FASE 1.3 - Parando polling');
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
    console.log('[Auto QR Polling] 🚀 FASE 1.3 - Iniciando polling intensivo para:', instanceName);
    console.log('[Auto QR Polling] 📋 FASE 1.3 - Configuração:', {
      instanceId,
      instanceName,
      maxAttempts,
      pollingActive: isPollingRef.current
    });
    
    // Parar qualquer polling anterior
    stopPolling();
    
    setIsPolling(true);
    setCurrentAttempt(0);
    isPollingRef.current = true;

    const poll = async (attempt: number) => {
      if (!isPollingRef.current || attempt > maxAttempts) {
        console.log('[Auto QR Polling] ⏰ FASE 1.3 - Polling finalizado - máximo de tentativas atingido:', {
          isPollingActive: isPollingRef.current,
          currentAttempt: attempt,
          maxAttempts
        });
        stopPolling();
        toast.error(`Timeout: QR Code não foi gerado após ${maxAttempts} tentativas. Verifique a conectividade da VPS.`);
        return;
      }

      try {
        console.log(`[Auto QR Polling] ⚡ FASE 1.3 - Tentativa ${attempt}/${maxAttempts} para ${instanceName}`);
        console.log(`[Auto QR Polling] 📊 FASE 1.3 - Estado atual:`, {
          instanceId,
          instanceName,
          attempt,
          maxAttempts,
          timestamp: new Date().toISOString()
        });
        
        setCurrentAttempt(attempt);

        const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_qr_code_async',
            instanceData: { instanceId }
          }
        });

        if (error) {
          console.error(`[Auto QR Polling] ❌ FASE 1.3 - Erro Supabase (tentativa ${attempt}):`, error);
          throw error;
        }

        console.log(`[Auto QR Polling] 📥 FASE 1.3 - Resposta completa (tentativa ${attempt}):`, {
          success: data.success,
          hasQrCode: !!data.qrCode,
          qrCodeLength: data.qrCode ? data.qrCode.length : 0,
          qrCodePreview: data.qrCode ? data.qrCode.substring(0, 50) + '...' : null,
          waiting: data.waiting,
          source: data.source,
          error: data.error,
          retryAfter: data.retryAfter
        });

        if (data.success && data.qrCode) {
          // FASE 1.3: Validação intensiva do QR Code
          const isValidBase64 = data.qrCode.length > 500;
          const hasDataUrl = data.qrCode.startsWith('data:image/') || data.qrCode.startsWith('data:image');
          
          console.log(`[Auto QR Polling] 🔍 FASE 1.3 - Validação do QR Code:`, {
            qrCodeLength: data.qrCode.length,
            isValidBase64,
            hasDataUrl,
            startsWithData: data.qrCode.substring(0, 20),
            source: data.source
          });

          if (isValidBase64) {
            console.log(`[Auto QR Polling] 🎉 FASE 1.3 - QR Code VÁLIDO recebido na tentativa ${attempt}!`, {
              fonte: data.source,
              tamanho: data.qrCode.length,
              formato: hasDataUrl ? 'data URL' : 'base64 puro'
            });
            
            onQRReceived(data.qrCode);
            stopPolling();
            return;
          } else {
            console.warn(`[Auto QR Polling] ⚠️ FASE 1.3 - QR Code recebido mas inválido (muito pequeno):`, {
              tamanho: data.qrCode.length,
              conteudo: data.qrCode.substring(0, 100)
            });
          }
        }

        if (data.waiting) {
          // FASE 1.3: Intervalos otimizados baseados no retryAfter da resposta
          let delay = data.retryAfter || 2000; // Usar sugestão da API ou 2s padrão
          
          // Intervalos progressivos para casos sem sugestão
          if (!data.retryAfter) {
            if (attempt <= 5) delay = 1500;      // 1.5s primeiras 5 tentativas
            else if (attempt <= 12) delay = 2500; // 2.5s tentativas 6-12
            else delay = 3500;                    // 3.5s tentativas finais
          }

          console.log(`[Auto QR Polling] ⏳ FASE 1.3 - Aguardando ${delay/1000}s para próxima tentativa...`, {
            retryAfterSuggestion: data.retryAfter,
            delayUsed: delay,
            nextAttempt: attempt + 1
          });
          
          pollingRef.current = setTimeout(() => {
            if (isPollingRef.current) {
              poll(attempt + 1);
            }
          }, delay);
        } else {
          throw new Error(data.error || 'Falha desconhecida ao obter QR Code');
        }

      } catch (error: any) {
        console.error(`[Auto QR Polling] ❌ FASE 1.3 - Erro crítico na tentativa ${attempt}:`, {
          error: error.message,
          stack: error.stack,
          instanceId,
          instanceName
        });
        
        if (attempt >= maxAttempts) {
          stopPolling();
          toast.error(`Erro persistente após ${maxAttempts} tentativas: ${error.message}. Verifique a VPS.`);
        } else {
          // FASE 1.3: Retry mais rápido em caso de erro crítico
          console.log(`[Auto QR Polling] 🔄 FASE 1.3 - Retry em 2s devido a erro crítico...`);
          pollingRef.current = setTimeout(() => {
            if (isPollingRef.current) {
              poll(attempt + 1);
            }
          }, 2000);
        }
      }
    };

    // Iniciar primeira tentativa imediatamente
    console.log('[Auto QR Polling] 🎬 FASE 1.3 - Iniciando primeira tentativa imediatamente');
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
