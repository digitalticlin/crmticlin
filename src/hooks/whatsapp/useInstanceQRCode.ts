
import { useCallback } from 'react';
import { QRCodeService } from '@/services/whatsapp/qrCodeService';
import { StatusSyncService } from '@/services/whatsapp/statusSyncService';
import { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstanceQRCode = (
  instances: WhatsAppWebInstance[], 
  refreshInstances: () => Promise<void>
) => {
  
  const refreshInstanceQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log(`[Instance QR Code] 🔄 Atualizando QR Code: ${instanceId}`);
      
      // CORREÇÃO: Primeiro sincronizar status
      await StatusSyncService.syncInstanceStatus(instanceId);
      
      // Verificar se a instância ainda precisa de QR Code
      const instance = instances.find(i => i.id === instanceId);
      
      if (instance?.connection_status === 'ready') {
        console.log(`[Instance QR Code] ℹ️ Instância já conectada: ${instanceId}`);
        return {
          success: true,
          qrCode: null,
          message: 'Instância já conectada'
        };
      }
      
      // Tentar gerar QR Code
      const result = await QRCodeService.generateQRCode(instanceId);
      
      if (result.success) {
        await refreshInstances();
      }
      
      return result;
      
    } catch (error: any) {
      console.error(`[Instance QR Code] ❌ Erro:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [instances, refreshInstances]);

  return {
    refreshInstanceQRCode
  };
};
