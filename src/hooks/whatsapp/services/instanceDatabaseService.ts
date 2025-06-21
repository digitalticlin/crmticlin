
import { supabase } from "@/integrations/supabase/client";

export interface InstanceData {
  instance_name: string;
  phone: string;
  created_by_user_id: string;
  connection_status: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  qr_code: string;
  session_data?: any;
}

export const saveInstanceToDatabase = async (instanceData: InstanceData) => {
  try {
    console.log("💾 Saving instance to database:", {
      instance_name: instanceData.instance_name,
      created_by_user_id: instanceData.created_by_user_id,
      connection_status: instanceData.connection_status
    });

    // Check if instance already exists
    const { data: existingInstance } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name", instanceData.instance_name)
      .eq("created_by_user_id", instanceData.created_by_user_id)
      .single();

    if (existingInstance) {
      // Update existing instance
      const { data: updatedInstance, error: updateError } = await supabase
        .from("whatsapp_instances")
        .update({
          phone: instanceData.phone,
          connection_status: instanceData.connection_status,
          connection_type: instanceData.connection_type,
          server_url: instanceData.server_url,
          vps_instance_id: instanceData.vps_instance_id,
          web_status: instanceData.web_status,
          qr_code: instanceData.qr_code,
          session_data: instanceData.session_data,
          updated_at: new Date().toISOString(),
          date_connected: instanceData.connection_status === "connected" ? new Date().toISOString() : null,
        })
        .eq("id", existingInstance.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedInstance;
    }

    // Create new instance
    const { data: newInstance, error: insertError } = await supabase
      .from("whatsapp_instances")
      .insert({
        instance_name: instanceData.instance_name,
        phone: instanceData.phone,
        created_by_user_id: instanceData.created_by_user_id,
        connection_status: instanceData.connection_status,
        connection_type: instanceData.connection_type,
        server_url: instanceData.server_url,
        vps_instance_id: instanceData.vps_instance_id,
        web_status: instanceData.web_status,
        qr_code: instanceData.qr_code,
        session_data: instanceData.session_data,
        date_connected: instanceData.connection_status === "connected" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newInstance;

  } catch (error) {
    console.error("💥 Error saving instance to database:", error);
    throw error;
  }
};

export const getCurrentUserId = async (): Promise<string> => {
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return userId;
};
