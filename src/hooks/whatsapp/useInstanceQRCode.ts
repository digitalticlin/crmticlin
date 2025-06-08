
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstanceQRCode = (instances: WhatsAppWebInstance[], fetchInstances: () => Promise<void>) => {
  const refreshInstanceQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Instance QR Code] 🔄 CORREÇÃO TOTAL - Gerando QR Code:', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      console.log('[Instance QR Code] 📋 Instância encontrada:', {
        instanceId: instance.id,
        vpsInstanceId: instance.vps_instance_id,
        instanceName: instance.instance_name
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
          instanceId: instanceId
        }
      });

      console.log('[Instance QR Code] 📡 Resposta da edge function:', { data, error });

      if (error) {
        console.error('[Instance QR Code] ❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Resposta vazia da edge function');
      }

      if (!data.success) {
        if (data.waiting) {
          console.log('[Instance QR Code] ⏳ QR Code ainda sendo gerado');
          return {
            success: false,
            waiting: true,
            error: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data.error || 'Falha ao gerar QR Code');
      }

      console.log('[Instance QR Code] ✅ QR Code gerado com sucesso!');

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
