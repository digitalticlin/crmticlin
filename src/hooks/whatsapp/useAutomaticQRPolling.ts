
import { useState, useCallback, useRef } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useAutomaticQRPolling = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const maxAttempts = 15; // Reduzido para 15 tentativas
  const pollingTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // CORREÇÃO CRÍTICA: Cleanup melhorado
  const cleanup = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsPolling(false);
    setCurrentAttempt(0);
  }, []);

  // CORREÇÃO CRÍTICA: Polling SINCRONIZADO com VPS
  const startPolling = useCallback(async (
    instanceId: string,
    instanceName: string,
    onQrCodeReceived: (qrCode: string) => void
  ) => {
    console.log('[QR Polling] 🔄 CORREÇÃO CRÍTICA - Iniciando polling sincronizado para:', instanceId);
    
    setIsPolling(true);
    setCurrentAttempt(0);
    
    // CORREÇÃO CRÍTICA: Delay inicial maior para dar tempo da VPS processar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Função recursiva de polling otimizada
    const pollForQrCode = async (attemptNumber: number) => {
      if (!isMountedRef.current || attemptNumber > maxAttempts) {
        console.log('[QR Polling] ❌ CORREÇÃO CRÍTICA - Limite de tentativas atingido ou componente desmontado');
        cleanup();
        return;
      }
      
      try {
        console.log(`[QR Polling] 📱 CORREÇÃO CRÍTICA - Tentativa ${attemptNumber}/${maxAttempts} sincronizada`);
        setCurrentAttempt(attemptNumber);
        
        const result = await WhatsAppWebService.getQRCode(instanceId);
        
        console.log('[QR Polling] 📊 CORREÇÃO CRÍTICA - Resposta sincronizada:', {
          success: result.success,
          waiting: result.waiting,
          hasQrCode: !!result.qrCode,
          error: result.error
        });
        
        if (result.success && result.qrCode) {
          console.log('[QR Polling] ✅ CORREÇÃO CRÍTICA - QR Code obtido via polling sincronizado!');
          onQrCodeReceived(result.qrCode);
          setIsPolling(false);
          return;
        }
        
        // Se ainda está aguardando, continuar polling com delay otimizado
        if (result.waiting || attemptNumber < maxAttempts) {
          // CORREÇÃO CRÍTICA: Delay progressivo otimizado
          const delayMs = Math.min(3000 + (attemptNumber * 1000), 8000);
          
          console.log(`[QR Polling] ⏳ CORREÇÃO CRÍTICA - Próxima tentativa em ${delayMs}ms`);
          
          pollingTimeoutRef.current = window.setTimeout(() => {
            pollForQrCode(attemptNumber + 1);
          }, delayMs);
        } else {
          console.log('[QR Polling] ❌ CORREÇÃO CRÍTICA - Número máximo de tentativas atingido');
          cleanup();
        }
      } catch (error) {
        console.error('[QR Polling] ❌ CORREÇÃO CRÍTICA - Erro no polling sincronizado:', error);
        
        // CORREÇÃO CRÍTICA: Retry com backoff em caso de erro
        if (attemptNumber < maxAttempts) {
          const errorDelayMs = Math.min(5000 + (attemptNumber * 1500), 10000);
          
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

  // CORREÇÃO CRÍTICA: Controle para parar o polling
  const stopPolling = useCallback(() => {
    console.log('[QR Polling] 🛑 CORREÇÃO CRÍTICA - Parando polling sincronizado');
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
