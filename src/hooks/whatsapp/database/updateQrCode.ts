
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConnectionStatus } from "./whatsappDatabaseTypes";

/**
 * Updates the QR code of a WhatsApp instance in the database
 * Now uses the new modular whatsapp_qr_service
 */
export const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
  console.log(`[QR Update] 💾 Atualizando QR code no banco para: ${instanceId}`);
  console.log(`[QR Update] 🔍 QR code (primeiros 50 chars):`, qrCodeUrl.substring(0, 50));
  
  try {
    // Usar o novo serviço modular para salvar QR Code
    const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
      body: {
        action: 'save_qr_code',
        instanceId: instanceId,
        qrCode: qrCodeUrl
      }
    });

    if (error) {
      console.error(`[QR Update] ❌ Erro na função:`, error);
      throw new Error(error.message || 'Erro ao chamar serviço de QR Code');
    }

    if (!data || !data.success) {
      console.error(`[QR Update] ❌ Falha no serviço:`, data?.error);
      throw new Error(data?.error || 'Falha ao salvar QR Code');
    }

    console.log(`[QR Update] ✅ QR Code atualizado com sucesso via serviço modular`);
    
  } catch (error: any) {
    console.error(`[QR Update] ❌ Erro ao atualizar QR code:`, error);
    
    // Fallback: tentar salvar diretamente no banco se o serviço falhar
    console.log(`[QR Update] 🔄 Tentando fallback direto no banco...`);
    
    const { error: directError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: qrCodeUrl,
        connection_status: 'connecting' as WhatsAppConnectionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);
      
    if (directError) {
      console.error(`[QR Update] ❌ Erro no fallback:`, directError);
      throw directError;
    }
    
    console.log(`[QR Update] ✅ QR Code salvo via fallback direto`);
  }
};
