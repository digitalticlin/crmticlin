
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInstance } from "./whatsappInstanceStore";

// Define a type for the allowed status values to match the database enum
type WhatsAppStatus = "connected" | "connecting" | "disconnected";

// Salva instância no banco de dados
export const saveInstanceToDatabase = async (
  instance: WhatsAppInstance, 
  qrCodeUrl: string, 
  result: any
) => {
  console.log(`Salvando instância no banco de dados: ${instance.instanceName}`);
  console.log("QR Code a ser salvo (primeiros 50 caracteres):", qrCodeUrl.substring(0, 50));
  
  try {
    // Obter o ID da empresa do usuário atual
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Erro ao obter dados do usuário atual:", userError);
      throw new Error("Erro ao obter dados do usuário atual");
    }
    
    const userId = userData.user?.id;
    console.log("ID do usuário atual:", userId);
    
    // Obter o company_id do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Erro ao obter perfil do usuário:", profileError);
      throw new Error("Erro ao obter perfil do usuário");
    }
    
    if (!profileData) {
      console.error("Perfil do usuário não encontrado");
      throw new Error("Perfil do usuário não encontrado");
    }
    
    const companyId = profileData.company_id;
    console.log("Company ID do usuário:", companyId);
    
    if (!companyId) {
      console.error("Usuário não está associado a uma empresa");
      throw new Error("Usuário não está associado a uma empresa");
    }
    
    // Preparar dados para inserção/atualização
    const whatsappData = {
      instance_name: instance.instanceName,
      phone: instance.phoneNumber || "", // Será atualizado quando conectado
      company_id: companyId,
      status: "connecting" as WhatsAppStatus,
      qr_code: qrCodeUrl,
      instance_id: result.instance.instanceId,
      evolution_instance_name: result.instance.instanceName,
      evolution_token: result.hash // Salvar o hash retornado para uso futuro
    };
    
    console.log("Dados a serem salvos no banco:", whatsappData);
    
    // Inserir ou atualizar no banco de dados
    const { error, data } = await supabase
      .from('whatsapp_numbers')
      .upsert(whatsappData, { onConflict: 'instance_name' })
      .select();
  
    if (error) {
      console.error("Erro ao salvar instância no banco de dados:", error);
      throw error;
    }
    
    console.log("Resultado da operação no banco:", data);
    
    if (!data || data.length === 0) {
      console.log("Select não retornou dados, buscando o registro inserido/atualizado...");
      // Busca o registro inserido/atualizado se select não o retornou
      const { data: fetchedData, error: fetchError } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('instance_name', instance.instanceName)
        .limit(1);
        
      if (fetchError) {
        console.error("Erro ao recuperar instância após salvamento:", fetchError);
        throw new Error("Erro ao recuperar instância após salvamento");
      }
      
      if (!fetchedData || fetchedData.length === 0) {
        console.error("Não foi possível encontrar a instância após o salvamento");
        throw new Error("Erro ao recuperar instância após salvamento");
      }
      
      console.log("Dados recuperados após salvamento:", fetchedData[0]);
      return fetchedData[0];
    }
    
    console.log("Dados retornados após salvamento:", data[0]);
    return data[0];
  } catch (error) {
    console.error("Falha ao salvar instância no banco de dados:", error);
    throw new Error("Erro ao salvar a instância no banco de dados");
  }
};

// Atualiza status da instância para desconectado no banco de dados
export const updateInstanceDisconnectedStatus = async (instanceId: string) => {
  console.log(`Atualizando instância ${instanceId} para status desconectado no banco de dados`);
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update({
      status: 'disconnected' as WhatsAppStatus,
      date_disconnected: new Date().toISOString(),
      qr_code: null
    })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar status da instância:", error);
    throw error;
  }
};

// Atualiza QR code no banco de dados
export const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
  console.log(`Atualizando QR code no banco de dados para ID de instância: ${instanceId}`);
  console.log("Novo QR code (primeiros 50 caracteres):", qrCodeUrl.substring(0, 50));
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update({ 
      qr_code: qrCodeUrl,
      status: 'connecting' as WhatsAppStatus
    })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar QR code no banco de dados:", error);
    throw error;
  }
  
  console.log("QR code atualizado com sucesso no banco de dados");
};

// Atualizar o status e número de telefone na base de dados
export const updateInstanceStatusAndPhone = async (instanceId: string, status: WhatsAppStatus, phone?: string) => {
  console.log(`Atualizando status e telefone da instância ${instanceId} no banco de dados`);
  
  const updateData: any = { 
    status,
    ...(status === 'connected' ? { date_connected: new Date().toISOString() } : {})
  };
  
  if (phone) {
    updateData.phone = phone;
  }
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update(updateData)
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar status e telefone da instância:", error);
    throw error;
  }
  
  console.log("Status e telefone da instância atualizados com sucesso");
};
