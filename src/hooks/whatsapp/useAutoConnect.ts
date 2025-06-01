
import { useState } from 'react';
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";

export interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  instanceId: string | null;
  qrCode: string | null;
  error: string | null;
}

export const useAutoConnect = () => {
  const [state, setState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    instanceId: null,
    qrCode: null,
    error: null
  });

  const generateInstanceName = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `whatsapp_${timestamp}_${random}`;
  };

  const startConnection = async () => {
    try {
      setState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        error: null,
        showQRModal: true 
      }));

      const instanceName = generateInstanceName();
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (!result.success) {
        throw new Error(result.error || 'Falha ao criar instância');
      }

      setState(prev => ({
        ...prev,
        instanceId: result.instance?.id || null,
        qrCode: result.instance?.qr_code || null
      }));

      toast.success('Instância criada! Escaneie o QR code para conectar.');

    } catch (error) {
      console.error('Error in auto connect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false
      }));
      
      toast.error(errorMessage);
    }
  };

  const closeQRModal = () => {
    setState(prev => ({ ...prev, showQRModal: false }));
  };

  const openQRModal = () => {
    setState(prev => ({ ...prev, showQRModal: true }));
  };

  const refreshQRCode = async () => {
    if (!state.instanceId) return;

    try {
      // Aqui você pode implementar a lógica para buscar um novo QR code
      // Por enquanto, vamos apenas fechar e reabrir o modal
      setState(prev => ({ ...prev, qrCode: null }));
      
      // Simular busca de novo QR code
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          qrCode: `data:image/png;base64,updated_qr_${Date.now()}` 
        }));
      }, 1000);
      
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      toast.error('Erro ao atualizar QR code');
    }
  };

  const reset = () => {
    setState({
      isConnecting: false,
      showQRModal: false,
      instanceId: null,
      qrCode: null,
      error: null
    });
  };

  return {
    state,
    startConnection,
    closeQRModal,
    openQRModal,
    refreshQRCode,
    reset
  };
};
