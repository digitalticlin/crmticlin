
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WhatsAppWebInstance } from './useWhatsAppWebInstances';

export const useInstanceQRCode = (instances: WhatsAppWebInstance[], fetchInstances: () => Promise<void>) => {
  // CORREÇÃO FASE 3.1: Função para atualizar QR Code de uma instância específica
  const refreshInstanceQRCode = useCallback(async (instanceId: string) => {
    try {
      console.log('[Instance QR Code] 🔄 Atualizando QR Code (FASE 3.1):', instanceId);

      const instance = instances.find(i => i.id === instanceId);
      if (!instance?.vps_instance_id) {
        throw new Error('VPS Instance ID não encontrado');
      }

      // Chamar Edge Function para obter QR Code atualizado
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'refresh_qr_code',
          instanceData: {
            instanceId: instance.vps_instance_id
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
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
