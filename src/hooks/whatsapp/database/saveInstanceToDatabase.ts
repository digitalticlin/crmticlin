
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInstance } from "../whatsappInstanceStore";
import { WhatsAppConnectionStatus, EvolutionApiResult } from "./whatsappDatabaseTypes";

/**
 * Saves a WhatsApp instance to the database
 */
export const saveInstanceToDatabase = async (
  instance: WhatsAppInstance, 
  qrCodeUrl: string, 
  result: EvolutionApiResult
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
      connection_status: "connecting" as WhatsAppConnectionStatus,
      qr_code: qrCodeUrl,
      instance_id: result.instance.instanceId,
      evolution_instance_name: result.instance.instanceName,
      evolution_token: result.hash // Salvar o hash retornado para uso futuro
    };
    
    console.log("Dados a serem salvos no banco:", whatsappData);
    
    // Inserir ou atualizar no banco de dados
    const { error, data } = await supabase
      .from('whatsapp_instances')
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
    console.error("Falha ao salvar instância no banco de dados:", error);
    throw new Error("Erro ao salvar a instância no banco de dados");
  }
};
