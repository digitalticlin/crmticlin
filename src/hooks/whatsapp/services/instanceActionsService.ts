
import { useCallback } from 'react';
import { toast } from 'sonner';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';

export const useInstanceActions = (fetchInstances: () => Promise<void>) => {
  // CORREÇÃO CRÍTICA: Create instance com confirmação COMPLETA da VPS
  const createInstance = useCallback(async (instanceName: string) => {
    try {
      console.log('[Hook] 🆕 CORREÇÃO CRÍTICA - Criando instância com confirmação VPS:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (result.success && result.instance) {
        console.log('[Hook] ✅ CORREÇÃO CRÍTICA - Instância criada e confirmada pela VPS:', {
          id: result.instance.id,
          name: result.instance.instance_name,
          hasQR: !!result.instance.qr_code,
          vpsInstanceId: result.instance.vps_instance_id
        });
        
        // CORREÇÃO CRÍTICA: Só mostrar sucesso após confirmação VPS
        toast.success(`Instância "${instanceName}" criada na VPS!`);
        
        // CORREÇÃO CRÍTICA: Aguardar sincronização com banco antes de atualizar lista
        await new Promise(resolve => setTimeout(resolve, 1500));
        await fetchInstances();
        
        // CORREÇÃO CRÍTICA: Retornar instância APENAS quando VPS confirmou
        return result.instance;
      } else {
        throw new Error(result.error || 'VPS não confirmou criação da instância');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ CORREÇÃO CRÍTICA - Erro na criação/confirmação VPS:', error);
      toast.error(`Erro ao criar instância na VPS: ${error.message}`);
      throw error; // Re-throw para tratamento no componente
    }
  }, [fetchInstances]);

  // Delete instance com confirmação
  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ CORREÇÃO CRÍTICA - Removendo instância:', instanceId);
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        console.log('[Hook] ✅ CORREÇÃO CRÍTICA - Instância removida com sucesso');
        toast.success('Instância removida com sucesso!');
        await fetchInstances();
      } else {
        throw new Error(result.error || 'Falha ao remover instância');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ CORREÇÃO CRÍTICA - Erro ao remover instância:', error);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  }, [fetchInstances]);

  // CORREÇÃO CRÍTICA: Refresh QR code com validação sincronizada
  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 CORREÇÃO CRÍTICA - Atualizando QR Code sincronizado para instância:', instanceId);
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        console.log('[Hook] ✅ CORREÇÃO CRÍTICA - QR Code sincronizado atualizado com sucesso');
        toast.success('QR Code atualizado com sucesso!');
        
        // CORREÇÃO CRÍTICA: Atualizar lista após obter QR Code
        await fetchInstances();
        
        return {
          success: true,
          qrCode: result.qrCode
        };
      } else if (result.waiting) {
        console.log('[Hook] ⏳ CORREÇÃO CRÍTICA - QR Code ainda sendo gerado pela VPS');
        toast.info('QR Code ainda está sendo gerado, aguarde...');
        return null;
      } else {
        throw new Error(result.error || 'VPS não forneceu QR Code');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ CORREÇÃO CRÍTICA - Erro ao atualizar QR Code:', error);
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
