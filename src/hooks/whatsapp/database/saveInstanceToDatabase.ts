
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInstance } from "../whatsappInstanceStore";
import { WhatsAppConnectionStatus, WhatsAppWebResult } from "./whatsappDatabaseTypes";

/**
 * Saves a WhatsApp Web.js instance to the database
 */
export const saveInstanceToDatabase = async (
  instance: WhatsAppInstance, 
  qrCodeUrl: string, 
  result: WhatsAppWebResult
) => {
  console.log(`Salvando instância WhatsApp Web.js no banco: ${instance.instanceName}`);
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
    
    // Preparar dados para inserção/atualização - apenas WhatsApp Web.js
    const whatsappData = {
      instance_name: instance.instanceName,
      phone: instance.phoneNumber || "",
      company_id: companyId,
      connection_status: "connecting" as WhatsAppConnectionStatus,
      connection_type: 'web' as const,
      server_url: instance.server_url || '',
      vps_instance_id: instance.vps_instance_id || '',
      web_status: 'waiting_scan',
      qr_code: qrCodeUrl,
      session_data: result
    };
    
    console.log("Dados WhatsApp Web.js a serem salvos no banco:", whatsappData);
    
    // Inserir ou atualizar no banco de dados
    const { error, data } = await supabase
      .from('whatsapp_instances')
      .upsert(whatsappData, { onConflict: 'instance_name' })
      .select();
  
    if (error) {
      console.error("Erro ao salvar instância WhatsApp Web.js no banco:", error);
      throw error;
    }
    
    console.log("Resultado da operação no banco:", data);
    
    if (!data || data.length === 0) {
      console.log("Select não retornou dados, buscando o registro inserido/atualizado...");
      // Busca o registro inserido/atualizado se select não o retornou
      const { data: fetchedData, error: fetchError } = await supabase
        .from('whatsapp_instances')
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
    console.error("Falha ao salvar instância WhatsApp Web.js no banco:", error);
    throw new Error("Erro ao salvar a instância no banco de dados");
  }
};
