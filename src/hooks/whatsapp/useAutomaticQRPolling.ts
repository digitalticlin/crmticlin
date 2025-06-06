
import { useState, useCallback, useRef } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useAutomaticQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const maxAttempts = 20;
  const pollingTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // FASE 3.0: Cleanup melhorado
  const cleanup = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsPolling(false);
    setCurrentAttempt(0);
  }, []);

  // FASE 3.0: SEQUÊNCIA CORRIGIDA - Polling melhorado com delay progressivo
  const startPolling = useCallback(async (
    instanceId: string,
    instanceName: string,
    onQrCodeReceived: (qrCode: string) => void
  ) => {
    console.log('[QR Polling] 🔄 FASE 3.0 - Iniciando polling otimizado para:', instanceId);
    
    setIsPolling(true);
    setCurrentAttempt(0);
    
    // FASE 3.0: Primeiro delay para dar tempo do backend processar
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Função recursiva de polling
    const pollForQrCode = async (attemptNumber: number) => {
      if (!isMountedRef.current || attemptNumber > maxAttempts) {
        cleanup();
        return;
      }
      
      try {
        console.log(`[QR Polling] 📱 FASE 3.0 - Tentativa ${attemptNumber}/${maxAttempts}`);
        setCurrentAttempt(attemptNumber);
        
        const result = await WhatsAppWebService.getQRCode(instanceId);
        
        console.log('[QR Polling] 📊 FASE 3.0 - Resposta:', {
          success: result.success,
          waiting: result.waiting,
          hasQrCode: !!result.qrCode,
          error: result.error
        });
        
        if (result.success && result.qrCode) {
          console.log('[QR Polling] ✅ FASE 3.0 - QR Code recebido com sucesso!');
          onQrCodeReceived(result.qrCode);
          setIsPolling(false);
          return;
        }
        
        // Se ainda está aguardando, continuar polling
        if (result.waiting || attemptNumber < maxAttempts) {
          // Calcular delay progressivo: começa com 2s e aumenta com mais tentativas
          const delayMs = Math.min(2000 + (attemptNumber * 500), 6000);
          
          console.log(`[QR Polling] ⏳ FASE 3.0 - Próxima tentativa em ${delayMs}ms`);
          
          pollingTimeoutRef.current = window.setTimeout(() => {
            pollForQrCode(attemptNumber + 1);
          }, delayMs);
        } else {
          console.log('[QR Polling] ❌ FASE 3.0 - Número máximo de tentativas atingido');
          cleanup();
        }
      } catch (error) {
        console.error('[QR Polling] ❌ FASE 3.0 - Erro ao obter QR code:', error);
        
        // Retry com backoff em caso de erro
        if (attemptNumber < maxAttempts) {
          const errorDelayMs = Math.min(3000 + (attemptNumber * 1000), 8000);
          
          pollingTimeoutRef.current = window.setTimeout(() => {
            pollForQrCode(attemptNumber + 1);
          }, errorDelayMs);
        } else {
          cleanup();
        }
      }
    };
    
    // Iniciar polling
    pollForQrCode(1);
    
    return () => cleanup();
  }, [cleanup]);

  // FASE 3.0: Melhor controle para parar o polling
  const stopPolling = useCallback(() => {
    console.log('[QR Polling] 🛑 FASE 3.0 - Parando polling');
    cleanup();
  }, [cleanup]);

  // Garantir cleanup ao desmontar
  useState(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  });

  return {
    isPolling,
    currentAttempt,
    maxAttempts,
    startPolling,
    stopPolling
  };
};
