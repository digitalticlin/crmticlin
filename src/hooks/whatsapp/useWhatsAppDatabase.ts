
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInstance } from "./whatsappInstanceStore";

// Save instance to database
export const saveInstanceToDatabase = async (
  instance: WhatsAppInstance, 
  qrCodeUrl: string, 
  result: any
) => {
  console.log(`Saving instance to database: ${instance.instanceName}`);
  
  try {
    // Gere um UUID aleatório para novas instâncias
    const instanceId = instance.id === "1" ? undefined : instance.id;
    
    const { error, data } = await supabase
      .from('whatsapp_numbers')
      .upsert({
        id: instanceId, // Let Supabase generate ID for new records
        instance_name: instance.instanceName,
        phone: "", // Will be updated when connected
        company_id: "your_company_id", // Replace with user's company ID
        status: "connecting",
        qr_code: qrCodeUrl,
        instance_id: result.instanceId,
        evolution_instance_name: result.instanceName
      }, { onConflict: 'instance_name' })
      .select();  // Return the inserted/updated data
  
    if (error) {
      console.error("Error saving instance to database:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      // Fetch the inserted/updated record if select didn't return it
      const { data: fetchedData, error: fetchError } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('instance_name', instance.instanceName)
        .limit(1);
        
      if (fetchError || !fetchedData || fetchedData.length === 0) {
        throw new Error("Error retrieving instance after saving");
      }
      
      return fetchedData[0];
    }
    
    return data[0];
  } catch (error) {
    console.error("Failed to save instance to database:", error);
    throw new Error("Erro ao salvar a instância no banco de dados");
  }
};

// Update instance status to disconnected in database
export const updateInstanceDisconnectedStatus = async (instanceId: string) => {
  if (instanceId === "1") return; // Skip DB update for placeholder ID
  
  console.log(`Updating instance ${instanceId} to disconnected status in database`);
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update({
      status: 'disconnected',
      date_disconnected: new Date().toISOString(),
      qr_code: null
    })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Error updating instance status:", error);
    throw error;
  }
};

// Update local instance state
export const updateLocalInstanceState = (
  instance: WhatsAppInstance | string,
  updatedDbInstance: any = null,
  qrCodeUrl?: string
) => {
  const instanceId = typeof instance === 'string' ? instance : instance.id;
  const oldInstance = typeof instance === 'string' ? null : instance;
  
  // If we have both the old instance and updated database record
  if (oldInstance && updatedDbInstance) {
    return {
      id: updatedDbInstance.id,
      instanceName: updatedDbInstance.instance_name,
      connected: false,
      qrCodeUrl
    };
  }
  
  // If we're just updating connection state or QR code of an existing instance
  return {
    connected: false,
    qrCodeUrl
  };
};

// Update QR code in database
export const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
  if (instanceId === "1") return; // Skip DB update for placeholder ID
  
  console.log(`Updating QR code in database for instance ID: ${instanceId}`);
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update({ qr_code: qrCodeUrl })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Error updating QR code in database:", error);
    throw error;
  }
};
