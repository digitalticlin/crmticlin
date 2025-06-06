
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConnectionStatus } from "@/hooks/whatsapp/database";

export interface InstanceDatabaseData {
  instance_name: string;
  phone: string;
  created_by_user_id: string;
  connection_status: WhatsAppConnectionStatus;
  connection_type: 'web';
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  qr_code: string;
  session_data?: any;
}

/**
 * Saves a new WhatsApp Web.js instance to the database
 */
export const saveInstanceToDatabase = async (instanceData: InstanceDatabaseData) => {
  const { data: insertData, error: dbError } = await supabase
    .from('whatsapp_instances')
    .insert(instanceData)
    .select();

  if (dbError) {
    throw new Error("Erro ao salvar a instância no banco");
  }

  return insertData && Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : null;
};

/**
 * Gets the current user ID
 */
export const getCurrentUserId = async (): Promise<string> => {
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return userId;
};
