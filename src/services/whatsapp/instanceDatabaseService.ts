
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConnectionStatus } from "@/hooks/whatsapp/database";

export interface InstanceDatabaseData {
  instance_name: string;
  phone: string;
  company_id: string;
  connection_status: WhatsAppConnectionStatus;
  qr_code: string;
  instance_id: string;
  evolution_instance_name: string;
  evolution_token: string;
}

/**
 * Saves a new WhatsApp instance to the database
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
 * Gets the user's company ID
 */
export const getUserCompanyId = async (): Promise<string> => {
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (!profileData?.company_id) {
    throw new Error("Erro ao obter a empresa do usuário");
  }

  return profileData.company_id;
};
