
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppConnectionStatus } from "./whatsappDatabaseTypes";

/**
 * Updates the status of a WhatsApp instance to disconnected in the database
 */
export const updateInstanceDisconnectedStatus = async (instanceId: string) => {
  console.log(`Atualizando instância ${instanceId} para status desconectado no banco de dados`);
  
  const { error } = await supabase
    .from('whatsapp_instances')
    .update({
      connection_status: 'disconnected' as WhatsAppConnectionStatus,
      date_disconnected: new Date().toISOString(),
      qr_code: null
    })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar status da instância:", error);
    throw error;
  }
};

/**
 * Updates the status and phone number of a WhatsApp instance in the database
 */
export const updateInstanceStatusAndPhone = async (instanceId: string, connection_status: WhatsAppConnectionStatus, phone?: string) => {
  console.log(`Atualizando status e telefone da instância ${instanceId} no banco de dados`);
  
  const updateData: any = { 
    connection_status,
    ...(connection_status === 'open' ? { date_connected: new Date().toISOString() } : {})
  };
  
  if (phone) {
    updateData.phone = phone;
  }
  
  const { error } = await supabase
    .from('whatsapp_instances')
    .update(updateData)
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar status e telefone da instância:", error);
    throw error;
  }
  
  console.log("Status e telefone da instância atualizados com sucesso");
};
