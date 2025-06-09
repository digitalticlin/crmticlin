
import { supabase } from "@/integrations/supabase/client";

interface QRCodeResult {
  success: boolean;
  qrCode?: string;
  waiting?: boolean;
  error?: string;
  source?: string;
  instanceId?: string;
  webStatus?: string;
}

export class ImprovedQRService {
  static async getQRCodeWithDetails(instanceId: string): Promise<QRCodeResult> {
    try {
      console.log(`[Improved QR Service] 🎯 CORREÇÃO: Buscando QR Code otimizado: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_qr_service otimizado
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code_v3',
          instanceId: instanceId
        }
      });

      console.log(`[Improved QR Service] 📥 Resposta otimizada:`, {
        success: data?.success,
        hasQrCode: !!(data?.qrCode),
        source: data?.source,
        waiting: data?.waiting,
        error: data?.error || error?.message
      });

      if (error) {
        console.error(`[Improved QR Service] ❌ Edge Function error:`, error);
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data) {
        throw new Error('Resposta vazia da edge function');
      }

      if (data.success && data.qrCode) {
        console.log(`[Improved QR Service] ✅ QR Code obtido com sucesso (fonte: ${data.source})!`);
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'optimized',
          instanceId: data.instanceId,
          webStatus: data.webStatus || 'waiting_scan'
        };
      }

      if (data.waiting) {
        console.log(`[Improved QR Service] ⏳ QR Code ainda sendo gerado`);
        return {
          success: false,
          waiting: true,
          error: data.error || 'QR Code ainda sendo gerado via sistema otimizado',
          instanceId: data.instanceId
        };
      }

      console.log(`[Improved QR Service] ❌ Falha na obtenção:`, data.error);
      return {
        success: false,
        error: data.error || 'Erro desconhecido ao obter QR Code'
      };

    } catch (error: any) {
      console.error(`[Improved QR Service] ❌ Erro geral:`, error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar QR Code'
      };
    }
  }

  static async testVPSConnection(): Promise<{ online: boolean; version?: string; error?: string }> {
    try {
      console.log('[Improved QR Service] 🧪 Testando conexão com VPS corrigida...');
      
      const response = await fetch('http://31.97.24.222:3002/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.version) {
        console.log('[Improved QR Service] ✅ VPS online (corrigida):', data);
        return {
          online: true,
          version: data.version
        };
      }
      
      throw new Error('Resposta inválida da VPS');
      
    } catch (error: any) {
      console.error('[Improved QR Service] ❌ VPS offline:', error);
      return {
        online: false,
        error: error.message
      };
    }
  }

  // NOVO: Método para refresh otimizado
  static async refreshQRCode(instanceId: string): Promise<QRCodeResult> {
    try {
      console.log(`[Improved QR Service] 🔄 Refresh QR Code: ${instanceId}`);

      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'refresh_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao fazer refresh do QR Code');
      }

      console.log(`[Improved QR Service] ✅ Refresh realizado com sucesso`);
      
      // Aguardar um pouco e buscar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return await this.getQRCodeWithDetails(instanceId);

    } catch (error: any) {
      console.error(`[Improved QR Service] ❌ Erro no refresh:`, error);
      return {
        success: false,
        error: error.message || 'Erro ao fazer refresh do QR Code'
      };
    }
  }
}
