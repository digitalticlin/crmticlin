
import { useState } from 'react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from 'sonner';

export const useInstanceActions = (fetchInstances: () => Promise<void>) => {
  const [isLoading, setIsLoading] = useState(false);

  const createInstance = async (instanceName: string) => {
    setIsLoading(true);
    try {
      console.log('[Instance Actions] 🚀 Criando instância:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (result.success) {
        toast.success(`Instância "${instanceName}" criada com sucesso!`);
        await fetchInstances(); // Recarregar lista
        return result;
      } else {
        throw new Error(result.error || 'Erro ao criar instância');
      }
    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    setIsLoading(true);
    try {
      console.log('[Instance Actions] 🗑️ Deletando instância:', instanceId);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        toast.success('Instância deletada com sucesso!');
        await fetchInstances(); // Recarregar lista
        return result;
      } else {
        throw new Error(result.error || 'Erro ao deletar instância');
      }
    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao deletar instância:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Usar método específico generateQRCode
  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Instance Actions] 📱 Gerando QR Code:', instanceId);
      
      const result = await WhatsAppWebService.generateQRCode(instanceId);
      
      if (result.success) {
        console.log('[Instance Actions] ✅ QR Code gerado com sucesso');
        await fetchInstances(); // Recarregar lista
        return result;
      } else if (result.waiting) {
        console.log('[Instance Actions] ⏳ QR Code ainda sendo gerado');
        return result;
      } else {
        throw new Error(result.error || 'Erro ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('[Instance Actions] ❌ Erro ao gerar QR Code:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
      throw error;
    }
  };

  return {
    createInstance,
    deleteInstance,
    refreshQRCode,
    isLoading
  };
};
