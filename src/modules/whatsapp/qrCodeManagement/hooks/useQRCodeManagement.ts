
import { useState, useCallback } from 'react';
import { QRCodeApi } from '../api/qrCodeApi';
import { toast } from 'sonner';

export const useQRCodeManagement = () => {
  const [qrCodeState, setQRCodeState] = useState<{
    [instanceId: string]: {
      qrCode: string | null;
      isLoading: boolean;
      error: string | null;
      isModalOpen: boolean;
    };
  }>({});

  const openQRModal = useCallback((instanceId: string) => {
    console.log('[QR Management] 📱 Abrindo modal QR para:', instanceId);
    
    setQRCodeState(prev => ({
      ...prev,
      [instanceId]: {
        qrCode: null,
        isLoading: true,
        error: null,
        isModalOpen: true
      }
    }));

    // Solicitar QR Code automaticamente
    requestQRCode(instanceId);
  }, []);

  const closeQRModal = useCallback((instanceId: string) => {
    console.log('[QR Management] 🔒 Fechando modal QR para:', instanceId);
    
    setQRCodeState(prev => ({
      ...prev,
      [instanceId]: {
        ...prev[instanceId],
        isModalOpen: false,
        isLoading: false
      }
    }));
  }, []);

  const requestQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[QR Management] 🔄 Solicitando QR Code:', instanceId);
      
      setQRCodeState(prev => ({
        ...prev,
        [instanceId]: {
          ...prev[instanceId],
          isLoading: true,
          error: null
        }
      }));

      const result = await QRCodeApi.requestQRCode(instanceId);

      if (result.success) {
        if (result.connected) {
          console.log('[QR Management] ✅ Instância já conectada:', instanceId);
          toast.success('WhatsApp já está conectado!');
          
          setQRCodeState(prev => ({
            ...prev,
            [instanceId]: {
              ...prev[instanceId],
              isLoading: false,
              isModalOpen: false
            }
          }));
          
        } else if (result.qrCode) {
          console.log('[QR Management] ✅ QR Code recebido:', instanceId);
          
          setQRCodeState(prev => ({
            ...prev,
            [instanceId]: {
              ...prev[instanceId],
              qrCode: result.qrCode!,
              isLoading: false,
              error: null
            }
          }));
          
        } else if (result.waiting) {
          console.log('[QR Management] ⏳ Aguardando QR Code:', instanceId);
          
          setQRCodeState(prev => ({
            ...prev,
            [instanceId]: {
              ...prev[instanceId],
              isLoading: true,
              error: null
            }
          }));
          
          // Retry em 3 segundos
          setTimeout(() => requestQRCode(instanceId), 3000);
        }
      } else {
        console.error('[QR Management] ❌ Erro ao solicitar QR Code:', result.error);
        
        setQRCodeState(prev => ({
          ...prev,
          [instanceId]: {
            ...prev[instanceId],
            isLoading: false,
            error: result.error || 'Erro ao gerar QR Code'
          }
        }));
        
        toast.error(`Erro ao gerar QR Code: ${result.error}`);
      }

    } catch (error: any) {
      console.error('[QR Management] ❌ Erro geral:', error);
      
      setQRCodeState(prev => ({
        ...prev,
        [instanceId]: {
          ...prev[instanceId],
          isLoading: false,
          error: error.message || 'Erro desconhecido'
        }
      }));
      
      toast.error(`Erro: ${error.message}`);
    }
  }, []);

  const getQRState = useCallback((instanceId: string) => {
    return qrCodeState[instanceId] || {
      qrCode: null,
      isLoading: false,
      error: null,
      isModalOpen: false
    };
  }, [qrCodeState]);

  return {
    openQRModal,
    closeQRModal,
    requestQRCode,
    getQRState
  };
};
