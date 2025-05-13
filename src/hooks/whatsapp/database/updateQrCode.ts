
import { supabase } from "@/integrations/supabase/client";

/**
 * Updates QR code for a WhatsApp instance in the database
 */
export const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string): Promise<void> => {
  console.log(`Updating QR code in database for instance: ${instanceId}`);
  console.log("QR Code URL first 50 chars:", qrCodeUrl.substring(0, 50));
  
  try {
    // Find the whatsapp_number record by its uuid
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .update({ 
        qr_code: qrCodeUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);
    
    if (error) {
      console.error("Error updating QR code in database:", error);
      throw error;
    }
    
    console.log("QR code updated successfully in database");
  } catch (error) {
    console.error("Failed to update QR code in database:", error);
    // Don't throw error to prevent breaking the flow
    // Just log it as a warning
    console.warn("QR code database update failed, but continuing flow");
  }
};
