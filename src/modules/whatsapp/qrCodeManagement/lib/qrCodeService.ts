
import { supabase } from "@/integrations/supabase/client";
import { QRCodeRequest, QRCodeResult } from '../types/qrCodeTypes';

export class QRCodeService {
  static async generateQRCode(params: QRCodeRequest): Promise<QRCodeResult> {
    try {
      console.log('[QRCodeService] 🔄 Solicitando QR Code para:', params.instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: {
          instanceId: params.instanceId
        }
      });

      if (error) {
        console.error('[QRCodeService] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      if (!data?.success) {
        console.error('[QRCodeService] ❌ Falha na geração:', data?.error);
        
        // Se já está conectado
        if (data?.connected) {
          return { success: true, connected: true };
        }
        
        // Se ainda está esperando
        if (data?.waiting) {
          return { success: false, waiting: true, error: data?.message || 'QR Code ainda não disponível' };
        }
        
        throw new Error(data?.error || 'Falha ao gerar QR Code');
      }

      console.log('[QRCodeService] ✅ QR Code gerado com sucesso');
      
      return { 
        success: true, 
        qrCode: data.qrCode 
      };

    } catch (error: any) {
      console.error('[QRCodeService] ❌ Erro ao gerar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar o tipo QRCodeResult também
export type { QRCodeResult } from '../types/qrCodeTypes';
