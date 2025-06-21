
import { supabase } from "@/integrations/supabase/client";

export interface QRCodeParams {
  instanceId: string;
}

export interface QRCodeResult {
  success: boolean;
  qrCode?: string;
  error?: string;
  waiting?: boolean;
  source?: string;
}

export class QRCodeManagementService {
  static async getQRCode(params: QRCodeParams): Promise<QRCodeResult> {
    try {
      console.log('[QRCode] 📱 Buscando QR Code para instância:', params.instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code',
          instanceId: params.instanceId
        }
      });

      if (error) {
        console.error('[QRCode] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      console.log('[QRCode] 📡 Resposta QR:', {
        success: data.success,
        hasQrCode: !!data.qrCode,
        waiting: data.waiting
      });

      if (data.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'api'
        };
      } else if (data.waiting) {
        return {
          success: false,
          waiting: true,
          error: 'QR Code sendo gerado'
        };
      } else {
        throw new Error(data.error || 'QR Code não disponível');
      }

    } catch (error: any) {
      console.error('[QRCode] ❌ Erro ao buscar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async refreshQRCode(params: QRCodeParams): Promise<QRCodeResult> {
    try {
      console.log('[QRCode] 🔄 Atualizando QR Code para instância:', params.instanceId);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'refresh_qr_code',
          instanceId: params.instanceId
        }
      });

      if (error) {
        console.error('[QRCode] ❌ Erro do Supabase:', error);
        throw new Error(error.message);
      }

      if (data.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'refresh'
        };
      } else {
        throw new Error(data.error || 'Falha ao atualizar QR Code');
      }

    } catch (error: any) {
      console.error('[QRCode] ❌ Erro ao atualizar QR Code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
