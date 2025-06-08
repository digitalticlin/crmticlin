
import { supabase } from "@/integrations/supabase/client";

interface QRCodeServiceResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
  waiting?: boolean;
  source?: string;
  instanceName?: string;
  cached?: boolean;
  age?: number;
  status?: string;
}

export class QRCodeService {
  static async generateQRCode(instanceId: string): Promise<QRCodeServiceResponse> {
    try {
      console.log(`[QR Code Service] 📱 Gerando QR Code para: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      console.log(`[QR Code Service] 📊 Resultado:`, {
        success: data.success,
        hasQrCode: !!data.qrCode,
        source: data.source,
        cached: data.cached,
        waiting: data.waiting
      });

      if (data.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'unknown',
          instanceName: data.instanceName,
          cached: data.cached || false,
          age: data.age
        };
      } else {
        return {
          success: false,
          waiting: data.waiting || false,
          error: data.error || 'QR Code não disponível',
          instanceName: data.instanceName,
          status: data.status
        };
      }

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
      console.log(`[QR Code Service] 📱 Obtendo QR Code para: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      console.log(`[QR Code Service] 📋 Resposta:`, {
        success: data.success,
        hasQrCode: !!data.qrCode,
        source: data.source,
        cached: data.cached,
        instanceName: data.instanceName
      });

      if (data.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'unknown',
          instanceName: data.instanceName,
          cached: data.cached || false,
          age: data.age
        };
      } else {
        return {
          success: false,
          waiting: data.waiting || false,
          error: data.error || 'QR Code não disponível',
          instanceName: data.instanceName,
          status: data.status
        };
      }

    } catch (error: any) {
      console.error(`[QR Code Service] ❌ Erro ao obter QR Code:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async saveQRCode(instanceId: string, qrCode: string): Promise<QRCodeServiceResponse> {
    try {
      console.log(`[QR Code Service] 💾 Salvando QR Code para: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'save_qr_code',
          instanceId: instanceId,
          qrCode: qrCode
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na chamada da função');
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      console.log(`[QR Code Service] 💾 Resultado do salvamento:`, data);

      return {
        success: data.success,
        error: data.error,
        instanceName: data.instanceName
      };

    } catch (error: any) {
      console.error(`[QR Code Service] ❌ Erro ao salvar QR Code:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
