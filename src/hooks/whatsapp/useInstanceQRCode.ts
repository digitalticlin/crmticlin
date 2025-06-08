
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstanceQRCode = (instances: WhatsAppWebInstance[], fetchInstances: () => Promise<void>) => {
  // CORREÇÃO: Usar whatsapp_qr_service com ação generate_qr
  const refreshInstanceQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Instance QR Code] 🔄 Gerando QR Code via nova arquitetura:', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      console.log('[Instance QR Code] 📋 Instância encontrada:', {
        instanceId: instance.id,
        vpsInstanceId: instance.vps_instance_id,
        instanceName: instance.instance_name
      });

      // CORREÇÃO: Usar whatsapp_qr_service com ação generate_qr
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[Instance QR Code] ❌ Erro do Supabase:', error);
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
        throw new Error(data.error || 'Falha ao gerar QR Code');
      }

      console.log('[Instance QR Code] ✅ QR Code gerado com sucesso');

      // Recarregar instâncias para obter dados atualizados
      await fetchInstances();

      return {
        success: true,
        qrCode: data.qrCode
      };

    } catch (error: any) {
      console.error('[Instance QR Code] ❌ Erro ao gerar QR Code:', error);
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
