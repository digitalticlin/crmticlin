
import { supabase } from '@/integrations/supabase/client';

export class QRCodeApi {
  static async requestQRCode(instanceId: string): Promise<{
    success: boolean;
    qrCode?: string;
    connected?: boolean;
    waiting?: boolean;
    error?: string;
  }> {
    try {
      console.log('[QR Code API] 📱 Solicitando QR Code para instância:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: { instanceId }
      });

      if (error) {
        console.error('[QR Code API] ❌ Erro na Edge Function:', error);
        return {
          success: false,
          error: error.message || 'Erro ao solicitar QR Code'
        };
      }

      console.log('[QR Code API] ✅ Resposta recebida:', data);
      return {
        success: data.success,
        qrCode: data.qrCode,
        connected: data.connected,
        waiting: data.waiting,
        error: data.error
      };

    } catch (error: any) {
      console.error('[QR Code API] ❌ Erro geral:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  static async checkQRCodeStatus(instanceId: string): Promise<{
    success: boolean;
    qrCode?: string;
    connected?: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      console.log('[QR Code API] 🔍 Verificando status QR Code:', instanceId);
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, connection_status, web_status')
        .eq('id', instanceId)
        .single();

      if (error) {
        console.error('[QR Code API] ❌ Erro ao buscar status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const isConnected = data.connection_status === 'connected';
      const hasQRCode = data.qr_code && data.qr_code.startsWith('data:image/');

      console.log('[QR Code API] ✅ Status verificado:', {
        connected: isConnected,
        hasQRCode,
        status: data.connection_status
      });

      return {
        success: true,
        qrCode: hasQRCode ? data.qr_code : undefined,
        connected: isConnected,
        status: data.connection_status
      };

    } catch (error: any) {
      console.error('[QR Code API] ❌ Erro geral:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }
}
