
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAutomaticQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [maxAttempts] = useState(15); // Reduzido de 20 para 15
  
  const pollingIntervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // CORREÇÃO: Limpar polling ao desmontar
  const stopPolling = useCallback(() => {
    console.log('[QR Polling] 🛑 CORREÇÃO - Parando polling');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (isMountedRef.current) {
      setIsPolling(false);
      setCurrentAttempt(0);
    }
  }, []);

  // CORREÇÃO: Polling otimizado com backoff progressivo
  const startPolling = useCallback(async (
    instanceId: string,
    instanceName: string,
    onQRCodeReceived: (qrCode: string) => void
  ) => {
    if (!isMountedRef.current) return;

    console.log('[QR Polling] 🚀 CORREÇÃO - Iniciando polling otimizado:', { instanceId, instanceName });
    
    setIsPolling(true);
    setCurrentAttempt(0);
    
    let attempt = 0;
    
    const pollForQR = async () => {
      if (!isMountedRef.current || attempt >= maxAttempts) {
        console.log(`[QR Polling] ⏰ CORREÇÃO - Timeout após ${attempt} tentativas`);
        stopPolling();
        toast.error('Tempo limite para obter QR Code. Tente novamente.');
        return;
      }

      attempt++;
      setCurrentAttempt(attempt);
      
      console.log(`[QR Polling] 📱 CORREÇÃO - Tentativa ${attempt}/${maxAttempts} sincronizada`);
      
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
          body: {
            action: 'get_qr_code_async',
            instanceData: { instanceId }
          }
        });

        if (!isMountedRef.current) return;

        if (error) {
          console.error('[QR Polling] ❌ CORREÇÃO - Erro na requisição:', error);
          throw error;
        }

        console.log('[QR Polling] 📊 CORREÇÃO - Resposta sincronizada:', {
          success: data.success,
          waiting: data.waiting,
          hasQrCode: !!data.qrCode,
          error: data.error
        });

        if (data.success && data.qrCode) {
          console.log('[QR Polling] ✅ CORREÇÃO - QR Code obtido com sucesso!');
          stopPolling();
          onQRCodeReceived(data.qrCode);
          return;
        }

        if (data.waiting) {
          // CORREÇÃO: Backoff progressivo - intervalos maiores conforme tentativas aumentam
          const baseDelay = 3000; // 3 segundos base
          const backoffMultiplier = Math.min(1 + (attempt * 0.3), 3); // Máximo 3x
          const delay = baseDelay * backoffMultiplier;
          
          console.log(`[QR Polling] ⏳ CORREÇÃO - Próxima tentativa em ${delay}ms`);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          pollingIntervalRef.current = window.setTimeout(pollForQR, delay);
          return;
        }

        // Erro não esperado
        throw new Error(data.error || 'Resposta inesperada da VPS');

      } catch (error: any) {
        console.error(`[QR Polling] ❌ CORREÇÃO - Erro na tentativa ${attempt}:`, error);
        
        if (attempt < maxAttempts) {
          // Retry com delay curto para erros
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          pollingIntervalRef.current = window.setTimeout(pollForQR, 2000);
        } else {
          console.log('[QR Polling] ⏰ CORREÇÃO - Máximo de tentativas atingido');
          stopPolling();
          toast.error(`Erro ao obter QR Code após ${maxAttempts} tentativas: ${error.message}`);
        }
      }
    };

    // Iniciar polling imediatamente
    pollForQR();
    
  }, [maxAttempts, stopPolling]);

  return {
    isPolling,
    currentAttempt,
    maxAttempts,
    startPolling,
    stopPolling
  };
};
