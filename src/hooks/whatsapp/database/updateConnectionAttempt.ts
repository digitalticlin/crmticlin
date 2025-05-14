
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
        instance_id: instanceId,
        success,
        error_message: errorMessage || null,
        timestamp: new Date().toISOString()
      });
      
    if (error) {
      console.error("Error recording connection attempt:", error);
    }
  } catch (insertError) {
    console.error("Exception recording connection attempt:", insertError);
  }
};
