
import { useState } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from 'sonner';

export const useInstanceActions = (onInstanceChange?: () => void) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createInstance = async (instanceName: string) => {
    try {
      setIsCreating(true);
      console.log('[Instance Actions] 🚀 Criando instância:', instanceName);

      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success) {
        toast.success('✅ Instância criada com sucesso!');
        onInstanceChange?.();
        return result;
      } else {
        toast.error(`❌ Erro ao criar instância: ${result.error}`);
        return result;
      }

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro na criação:', error);
      toast.error(`❌ Erro na criação: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsCreating(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setIsDeleting(true);
      console.log('[Instance Actions] 🗑️ Deletando instância:', instanceId);

      const result = await WhatsAppWebService.deleteInstance(instanceId);

      if (result.success) {
        toast.success('✅ Instância deletada com sucesso!');
        onInstanceChange?.();
        return result;
      } else {
        toast.error(`❌ Erro ao deletar instância: ${result.error}`);
        return result;
      }

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro na deleção:', error);
      toast.error(`❌ Erro na deleção: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Instance Actions] 🔄 Atualizando QR Code:', instanceId);

      const result = await WhatsAppWebService.getQRCode(instanceId);

      if (result.success && result.qrCode) {
        console.log('[Instance Actions] ✅ QR Code obtido');
        return result;
      } else {
        console.log('[Instance Actions] ⚠️ QR Code não disponível:', result.error);
        return result;
      }

    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro no QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    createInstance,
    deleteInstance,
    refreshQRCode,
    isCreating,
    isDeleting
  };
};
