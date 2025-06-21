
import { supabase } from "@/integrations/supabase/client";

interface ConnectionAttemptData {
  instanceId: string;
  userId: string;
  status: 'attempting' | 'success' | 'failed';
  error?: string;
}

export async function updateConnectionAttempt({
  instanceId,
  userId,
  status,
  error
}: ConnectionAttemptData) {
  try {
    console.log(`📝 Updating connection attempt for instance ${instanceId}:`, {
      status,
      error: error?.substring(0, 100)
    });

    // Update the whatsapp_instances table instead of non-existent whatsapp_connection_logs
    const { error: updateError } = await supabase
      .from("whatsapp_instances")
      .update({
        connection_status: status === 'success' ? 'connected' : status === 'failed' ? 'error' : 'connecting',
        updated_at: new Date().toISOString(),
        web_status: error || (status === 'success' ? 'Connected successfully' : 'Attempting connection')
      })
      .eq("id", instanceId)
      .eq("created_by_user_id", userId);

    if (updateError) {
      console.error("❌ Error updating connection attempt:", updateError);
      throw updateError;
    }

    console.log("✅ Connection attempt updated successfully");
    return true;

  } catch (error) {
    console.error("💥 Failed to update connection attempt:", error);
    throw error;
  }
}
