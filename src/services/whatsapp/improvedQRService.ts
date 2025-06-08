
import { supabase } from "@/integrations/supabase/client";

interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  error?: string;
  waiting?: boolean;
  status?: string;
  vpsInstanceId?: string;
}

export class ImprovedQRService {
  
  /**
   * Busca QR Code com logs detalhados e múltiplos endpoints
   */
  static async getQRCodeWithDetails(instanceId: string): Promise<QRCodeResponse> {
    try {
      console.log(`[Improved QR] 🔍 Buscando QR Code para instância: ${instanceId}`);
      
      // PASSO 1: Buscar dados da instância no banco
      const { data: instance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (dbError || !instance) {
        console.error('[Improved QR] ❌ Instância não encontrada no banco:', dbError);
        return {
          success: false,
          error: 'Instância não encontrada no banco de dados'
        };
      }

      const vpsInstanceId = instance.vps_instance_id;
      console.log(`[Improved QR] 📊 Dados da instância:`, {
        id: instance.id,
        name: instance.instance_name,
        vpsInstanceId: vpsInstanceId,
        status: instance.connection_status,
        hasQR: !!instance.qr_code
      });

      if (!vpsInstanceId) {
        console.error('[Improved QR] ❌ VPS Instance ID não encontrado');
        return {
          success: false,
          error: 'VPS Instance ID não encontrado'
        };
      }

      // PASSO 2: Usar whatsapp_qr_service que faz a comunicação com a VPS
      console.log(`[Improved QR] 🚀 Chamando whatsapp_qr_service...`);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[Improved QR] ❌ Erro na edge function:', error);
        return {
          success: false,
          error: `Erro na busca: ${error.message}`
        };
      }

      console.log(`[Improved QR] 📥 Resposta da whatsapp_qr_service:`, data);

      if (data?.success && data.qrCode) {
        console.log('[Improved QR] ✅ QR Code obtido com sucesso!');
        return {
          success: true,
          qrCode: data.qrCode,
          vpsInstanceId: vpsInstanceId
        };
      }

      // PASSO 3: Se não conseguiu, retornar status de espera
      return {
        success: false,
        waiting: true,
        status: data?.status || 'initializing',
        error: data?.error || 'QR Code ainda não disponível',
        vpsInstanceId: vpsInstanceId
      };

    } catch (error: any) {
      console.error('[Improved QR] ❌ Erro inesperado:', error);
      return {
        success: false,
        error: `Erro inesperado: ${error.message}`
      };
    }
  }

  /**
   * Força a geração de um novo QR Code
   */
  static async generateNewQRCode(instanceId: string): Promise<QRCodeResponse> {
    try {
      console.log(`[Improved QR] 🔄 Gerando novo QR Code para: ${instanceId}`);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'generate_qr',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[Improved QR] ❌ Erro ao gerar QR:', error);
        return {
          success: false,
          error: `Erro ao gerar: ${error.message}`
        };
      }

      console.log(`[Improved QR] 📥 Resposta da geração:`, data);

      if (data?.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode
        };
      }

      return {
        success: false,
        waiting: true,
        error: data?.error || 'QR Code sendo gerado...'
      };

    } catch (error: any) {
      console.error('[Improved QR] ❌ Erro na geração:', error);
      return {
        success: false,
        error: `Erro na geração: ${error.message}`
      };
    }
  }
}
