
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSaveQRCode = () => {
  const saveQRCode = useCallback(async (vpsInstanceId: string, qrCode: string) => {
    try {
      console.log('[Save QR Hook] 💾 Salvando QR Code:', {
        vpsInstanceId,
        qrCodeLength: qrCode.length
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'save_qr_code',
          qrData: {
            vpsInstanceId,
            qrCode
          }
        }
      });

      if (error) {
        console.error('[Save QR Hook] ❌ Erro do Supabase:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao salvar QR Code');
      }

      console.log('[Save QR Hook] ✅ QR Code salvo com sucesso:', data);
      toast.success(`QR Code salvo para ${data.instanceName}`);

      return {
        success: true,
        instanceId: data.instanceId,
        instanceName: data.instanceName
      };

    } catch (error: any) {
      console.error('[Save QR Hook] ❌ Erro ao salvar QR Code:', error);
      toast.error(`Erro ao salvar QR Code: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }, []);

  return {
    saveQRCode
  };
};
