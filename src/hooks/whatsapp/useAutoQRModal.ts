
import { useState, useRef } from "react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { useSmartPollingManager } from './useSmartPollingManager';
import { useAuth } from '@/contexts/AuthContext';

interface QRModalState {
  isOpen: boolean;
  instanceId: string;
  instanceName: string;
  qrCode: string | null;
  isLoading: boolean;
  error: string | null;
  attempt: number;
  maxAttempts: number;
}

export const useAutoQRModal = () => {
  const [modalState, setModalState] = useState<QRModalState>({
    isOpen: false,
    instanceId: '',
    instanceName: '',
    qrCode: null,
    isLoading: false,
    error: null,
    attempt: 0,
    maxAttempts: 15
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { shouldActivatePolling } = useSmartPollingManager(user?.id);

  const openQRModal = (instanceId: string, instanceName: string) => {
    console.log('[Auto QR Modal] 📱 CORREÇÃO FINAL: Abrindo modal para:', { instanceId, instanceName });
    
    // Parar polling anterior se existir
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setModalState({
      isOpen: true,
      instanceId,
      instanceName,
      qrCode: null,
      isLoading: true,
      error: null,
      attempt: 0,
      maxAttempts: 15
    });

    // CORREÇÃO FINAL: Iniciar polling usando whatsapp_qr_service corrigido
    startQRPolling(instanceId);
  };

  const startQRPolling = (instanceId: string) => {
    console.log('[Auto QR Modal] 🔄 OTIMIZADO: Iniciando polling inteligente (só quando necessário)');
    
    // CORREÇÃO: Polling otimizado - intervalo maior e condições de parada
    pollingRef.current = setInterval(async () => {
      // OTIMIZAÇÃO: Só fazer polling se necessário
      if (!shouldActivatePolling('qr')) {
        console.log('[Auto QR Modal] 💤 Polling pausado - nenhuma criação ativa');
        return;
      }

      try {
        setModalState(prev => ({
          ...prev,
          attempt: prev.attempt + 1,
          isLoading: true
        }));

        console.log(`[Auto QR Modal] 🔍 OTIMIZADO: Polling tentativa ${modalState.attempt + 1}/${modalState.maxAttempts}`);

        // CORREÇÃO FINAL: Usar WhatsAppWebService.getQRCode (que agora usa whatsapp_qr_service corrigido)
        const result = await WhatsAppWebService.getQRCode(instanceId);

        if (result.success && result.qrCode) {
          console.log('[Auto QR Modal] ✅ CORREÇÃO FINAL: QR Code obtido via whatsapp_qr_service corrigido!');
          
          setModalState(prev => ({
            ...prev,
            qrCode: result.qrCode,
            isLoading: false,
            error: null
          }));

          // Parar polling quando obtiver o QR
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
        } else if (result.waiting) {
          console.log('[Auto QR Modal] ⏳ QR Code ainda não disponível, continuando polling...');
          setModalState(prev => ({
            ...prev,
            isLoading: true,
            error: null
          }));
          
        } else {
          console.log('[Auto QR Modal] ❌ Erro ao obter QR:', result.error);
          setModalState(prev => ({
            ...prev,
            isLoading: false,
            error: result.error || 'Erro ao obter QR Code'
          }));
        }

        // Parar após máximo de tentativas
        if (modalState.attempt >= modalState.maxAttempts) {
          console.log('[Auto QR Modal] ⏰ Máximo de tentativas atingido');
          
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          
          setModalState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Timeout: QR Code não foi gerado. Tente novamente.'
          }));
        }

      } catch (error: any) {
        console.error('[Auto QR Modal] ❌ Erro no polling:', error);
        setModalState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    }, 5000); // OTIMIZADO: 5s durante criação para UX rápida - para automaticamente quando QR obtido
  };

  const retryQRCode = async () => {
    if (!modalState.instanceId) return;
    
    console.log('[Auto QR Modal] 🔄 CORREÇÃO FINAL: Retry manual via whatsapp_qr_service corrigido');
    
    setModalState(prev => ({
      ...prev,
      qrCode: null,
      isLoading: true,
      error: null,
      attempt: 0
    }));

    try {
      // CORREÇÃO FINAL: Usar WhatsAppWebService.refreshQRCode (que agora usa whatsapp_qr_service corrigido)
      const result = await WhatsAppWebService.refreshQRCode(modalState.instanceId);
      
      if (result.success && result.qrCode) {
        setModalState(prev => ({
          ...prev,
          qrCode: result.qrCode,
          isLoading: false,
          error: null
        }));
      } else {
        // Reiniciar polling se refresh não retornou QR imediatamente
        startQRPolling(modalState.instanceId);
      }
      
    } catch (error: any) {
      console.error('[Auto QR Modal] ❌ Erro no retry:', error);
      setModalState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  const closeModal = () => {
    console.log('[Auto QR Modal] 🧹 CORREÇÃO FINAL: Fechando modal e parando polling');
    
    // Parar polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    setModalState({
      isOpen: false,
      instanceId: '',
      instanceName: '',
      qrCode: null,
      isLoading: false,
      error: null,
      attempt: 0,
      maxAttempts: 15
    });
  };

  return {
    modalState,
    openQRModal,
    closeModal,
    retryQRCode
  };
};
