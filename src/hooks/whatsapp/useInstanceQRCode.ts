
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstanceQRCode = (instances: WhatsAppWebInstance[], fetchInstances: () => Promise<void>) => {
  // CORREÇÃO CRÍTICA: Usar get_qr_code_async em vez de refresh_qr_code
  const refreshInstanceQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Instance QR Code] 🔄 Atualizando QR Code (CORREÇÃO CRÍTICA):', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('VPS Instance ID não encontrado');
      }

      // CORREÇÃO: Chamar get_qr_code_async que existe na Edge Function
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'get_qr_code_async',
          instanceData: {
            instanceId: instance.vps_instance_id
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        if (data.waiting) {
          console.log('[Instance QR Code] ⏳ QR Code ainda sendo gerado');
          return {
            success: false,
            waiting: true,
            error: 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data.error || 'Falha ao atualizar QR Code');
      }

      console.log('[Instance QR Code] ✅ QR Code atualizado com sucesso');

      // Recarregar instâncias para obter dados atualizados
      await fetchInstances();

      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[Instance QR Code] ❌ Erro ao atualizar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }, [instances, fetchInstances]);

  return {
    refreshInstanceQRCode
  };
};
