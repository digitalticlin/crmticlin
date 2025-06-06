
import { useCallback } from 'react';
import { toast } from 'sonner';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useInstanceActions = (fetchInstances: () => Promise<void>) => {
  // FASE 3.0: Create instance modificado para garantir retorno da instância completa
  const createInstance = useCallback(async (instanceName: string) => {
    try {
      console.log('[Hook] 🆕 FASE 3.0 - Criando instância:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (result.success && result.instance) {
        console.log('[Hook] ✅ FASE 3.0 - Instância criada com sucesso:', {
          id: result.instance.id,
          name: result.instance.instance_name,
          hasQR: !!result.instance.qr_code
        });
        
        toast.success(`Instância "${instanceName}" criada com sucesso!`);
        
        // Atualizar lista de instâncias após criação bem-sucedida
        await fetchInstances();
        
        // FASE 3.0: Retornar instância completa com QR Code para o componente
        return result.instance;
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ FASE 3.0 - Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error; // Re-throw para tratamento no componente
    }
  }, [fetchInstances]);

  // Delete instance com confirmação
  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ FASE 3.0 - Removendo instância:', instanceId);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        console.log('[Hook] ✅ FASE 3.0 - Instância removida com sucesso');
        toast.success('Instância removida com sucesso!');
        await fetchInstances();
      } else {
        throw new Error(result.error || 'Falha ao remover instância');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ FASE 3.0 - Erro ao remover instância:', error);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  }, [fetchInstances]);

  // FASE 3.0: Refresh QR code melhorado
  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 FASE 3.0 - Atualizando QR Code para instância:', instanceId);
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log('[Hook] ✅ FASE 3.0 - QR Code atualizado com sucesso');
        toast.success('QR Code atualizado com sucesso!');
        
        // Atualizar lista após obter QR Code
        await fetchInstances();
        
        return {
          success: true,
          qrCode: result.qrCode
        };
      } else if (result.waiting) {
        console.log('[Hook] ⏳ FASE 3.0 - QR Code ainda sendo gerado');
        toast.info('QR Code ainda está sendo gerado, aguarde...');
        return null;
      } else {
        throw new Error(result.error || 'Falha ao obter QR Code');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ FASE 3.0 - Erro ao atualizar QR Code:', error);
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
