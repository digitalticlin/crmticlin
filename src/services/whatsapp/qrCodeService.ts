
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
      console.log(`[QR Code Service] 📱 Gerando QR Code: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
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
        qrCode: data.qrCode
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
      console.log(`[QR Code Service] 📱 Obtendo QR Code: ${instanceId}`);

      // Buscar QR Code do banco primeiro
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, web_status, vps_instance_id, updated_at')
        .eq('id', instanceId)
        .single();

      if (!instance) {
        return { success: false, error: 'Instância não encontrada' };
      }

      // Se tem QR Code válido no banco, retornar
      if (instance.qr_code && instance.qr_code.length > 10) {
        console.log(`[QR Code Service] ✅ QR Code encontrado no banco`);
        return {
          success: true,
          qrCode: instance.qr_code,
          source: 'database'
        };
      }

      // Se não tem QR Code, verificar se instância está conectada
      if (instance.connection_status === 'open' || instance.web_status === 'ready') {
        return {
          success: false,
          error: 'Instância já está conectada'
        };
      }

      // Tentar obter QR Code da VPS
      if (instance.vps_instance_id) {
        console.log(`[QR Code Service] 🔄 Tentando obter QR da VPS`);
        
        const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
          body: {
            action: 'get_qr',
            instanceId: instanceId
          }
        });

        if (!error && data?.success && data.qrCode) {
          return {
            success: true,
            qrCode: data.qrCode,
            source: 'vps'
          };
        }
      }

      return {
        success: false,
        waiting: true,
        error: 'QR Code ainda não foi gerado. O webhook irá atualizar automaticamente.'
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
