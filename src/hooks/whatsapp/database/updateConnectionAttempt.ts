
import { supabase } from "@/integrations/supabase/client";

/**
 * Records connection attempts in the database (success or failure)
 */
export const updateConnectionAttempt = async (
  instanceId: string, 
  success: boolean, 
  errorMessage?: string
) => {
  console.log(`Recording connection attempt for instance ${instanceId}: ${success ? 'Success' : 'Failed'}`);
  
  try {
    const { error } = await supabase
      .from('whatsapp_connection_logs')
      .insert({
        whatsapp_number_id: instanceId, // Use whatsapp_number_id instead of instance_id
        status: success ? 'connected' : 'disconnected', // Use correct enum values
        details: errorMessage || null, // Use details field instead of error_message
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error recording connection attempt:", error);
    }
  } catch (insertError) {
    console.error("Exception recording connection attempt:", insertError);
  }
};
