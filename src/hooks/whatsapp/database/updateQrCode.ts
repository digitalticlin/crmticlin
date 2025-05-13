
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppStatus } from "./whatsappDatabaseTypes";

/**
 * Updates the QR code of a WhatsApp instance in the database
 */
export const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
  console.log(`Atualizando QR code no banco de dados para ID de instância: ${instanceId}`);
  console.log("Novo QR code (primeiros 50 caracteres):", qrCodeUrl.substring(0, 50));
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update({ 
      qr_code: qrCodeUrl,
      status: 'connecting' as WhatsAppStatus
    })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar QR code no banco de dados:", error);
    throw error;
  }
  
  console.log("QR code atualizado com sucesso no banco de dados");
};
