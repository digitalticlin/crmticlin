
import { supabase } from "@/integrations/supabase/client";

interface QRCodeServiceResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
  waiting?: boolean;
  source?: string;
}

export class QRCodeService {
  static async generateQRCode(instanceId: string): Promise<QRCodeServiceResponse> {
    try {
      console.log(`[QR Code Service] 📱 CORREÇÃO: Usando whatsapp_qr_service v2 para gerar QR: ${instanceId}`);

      // CORREÇÃO: Continuar usando whatsapp_qr_service que faz o POST /instance/qr correto
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data || !data.success) {
        if (data?.waiting) {
          return {
            success: false,
            waiting: true,
            error: data.message || 'QR Code ainda sendo gerado'
          };
        }
        throw new Error(data?.error || 'Erro desconhecido na geração do QR Code');
      }

      return {
        success: true,
        qrCode: data.qrCode,
        source: 'whatsapp_qr_service_v2_corrected'
      };

    } catch (error: any) {
      console.error(`[QR Code Service] ❌ Erro na geração:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getQRCode(instanceId: string): Promise<QRCodeServiceResponse> {
    try {
      console.log(`[QR Code Service] 📱 CORREÇÃO: Usando whatsapp_qr_service v2 para obter QR: ${instanceId}`);

      // CORREÇÃO: Usar whatsapp_qr_service para buscar QR Code com endpoint correto
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_corrected',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      if (data.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'whatsapp_qr_service_v2_corrected'
        };
      }

      return {
        success: false,
        waiting: data.waiting || false,
        error: data.message || 'QR Code não disponível'
      };

    } catch (error: any) {
      console.error(`[QR Code Service] ❌ Erro ao obter QR Code:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
