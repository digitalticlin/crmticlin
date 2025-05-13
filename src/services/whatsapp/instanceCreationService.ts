
import { supabase } from "@/integrations/supabase/client";
import { evolutionApiService } from "@/services/evolution-api";
import { WhatsAppStatus } from "@/hooks/whatsapp/database";
import { generateUniqueInstanceName } from "@/utils/whatsapp/instanceNameGenerator";

/**
 * Creates a new WhatsApp instance and saves it to the database
 */
export const createWhatsAppInstance = async (username: string): Promise<{
  success: boolean;
  qrCode?: string;
  error?: string;
}> => {
  try {
    // Generate unique instance name
    const uniqueInstanceName = await generateUniqueInstanceName(username);
    console.log("Unique instance name generated:", uniqueInstanceName);
    
    // Get current user's company ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error("Error getting user data");
    }
    
    const userId = userData.user?.id;
    
    // Get company ID from user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData?.company_id) {
      throw new Error("Error getting user company");
    }
    
    const companyId = profileData.company_id;
    
    // Create instance via Evolution API
    const response = await evolutionApiService.createInstance(uniqueInstanceName);
    
    if (!response || !response.qrcode || !response.qrcode.base64) {
      throw new Error("QR code not received from API");
    }
    
    // Extract QR code
    const qrCode = response.qrcode.base64;
    
    // Save instance to database
    const whatsappData = {
      instance_name: uniqueInstanceName,
      phone: "", // Will be updated when connected
      company_id: companyId,
      status: "connecting" as WhatsAppStatus,
      qr_code: qrCode,
      instance_id: response.instanceId,
      evolution_instance_name: response.instanceName,
      evolution_token: response.hash || ""
    };
    
    // Insert into database
    const { error: dbError } = await supabase
      .from('whatsapp_numbers')
      .insert(whatsappData);
  
    if (dbError) {
      console.error("Error saving instance to database:", dbError);
      throw new Error("Error saving the instance");
    }
    
    return {
      success: true,
      qrCode: qrCode
    };
    
  } catch (error: any) {
    console.error("Complete error creating instance:", error);
    return {
      success: false,
      error: error.message || "Could not create WhatsApp instance"
    };
  }
};
