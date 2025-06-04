
import { useCallback } from 'react';
import { toast } from 'sonner';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useInstanceActions = (fetchInstances: () => Promise<void>) => {
  // CORREÇÃO FASE 3.1.2: Create instance modificado para retornar instância com QR Code
  const createInstance = useCallback(async (instanceName: string) => {
    try {
      console.log('[Hook] 🆕 Creating instance - FASE 3.1.2:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (result.success && result.instance) {
        console.log('[Hook] ✅ Instance created successfully - FASE 3.1.2');
        console.log('[Hook] 🎯 QR Code presente na resposta:', !!result.instance.qr_code);
        
        toast.success(`Instância "${instanceName}" criada com sucesso!`);
        await fetchInstances();
        
        // FASE 3.1.2: Retornar instância completa com QR Code para o componente
        return result.instance;
      } else {
        throw new Error(result.error || 'Failed to create instance');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Create instance error:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    }
  }, [fetchInstances]);

  // Delete instance with confirmation
  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ Deleting instance:', instanceId);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        console.log('[Hook] ✅ Instance deleted successfully');
        toast.success('Instância removida com sucesso!');
        await fetchInstances();
      } else {
        throw new Error(result.error || 'Failed to delete instance');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Delete instance error:', error);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  }, [fetchInstances]);

  // Refresh QR code
  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 Refreshing QR code for:', instanceId);
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log('[Hook] ✅ QR code refreshed');
        toast.success('QR Code atualizado!');
        await fetchInstances();
        return result.qrCode;
      } else {
        throw new Error(result.error || 'Failed to get QR code');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Refresh QR error:', error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
      return null;
    }
  }, [fetchInstances]);

  return {
    createInstance,
    deleteInstance,
    refreshQRCode
  };
};
