
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
      console.log(`[Improved QR Service] 🎯 CORREÇÃO: Usando VPS corrigida para QR Code: ${instanceId}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // CORREÇÃO: Usar whatsapp_qr_service com a VPS corrigida
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code_v3',
          instanceId: instanceId
        }
      });

      console.log(`[Improved QR Service] 📥 Resposta da edge function:`, data);

      if (error) {
        console.error(`[Improved QR Service] ❌ Edge Function error:`, error);
        throw new Error(error.message || 'Erro na chamada da edge function');
      }

      if (!data) {
        throw new Error('Resposta vazia da edge function');
      }

      if (data.success && data.qrCode) {
        console.log(`[Improved QR Service] ✅ QR Code obtido com sucesso!`);
        return {
          success: true,
          qrCode: data.qrCode,
          source: data.source || 'vps_corrected',
          instanceId: data.instanceId,
          webStatus: data.webStatus || 'waiting_scan'
        };
      }

      if (data.waiting) {
        console.log(`[Improved QR Service] ⏳ QR Code ainda sendo gerado`);
        return {
          success: false,
          waiting: true,
          error: data.error || 'QR Code ainda sendo gerado na VPS corrigida',
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
        console.log('[Improved QR Service] ✅ VPS online:', data);
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
}
