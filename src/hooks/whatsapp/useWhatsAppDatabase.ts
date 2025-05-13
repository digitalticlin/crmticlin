
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
    // Gere um UUID aleatório para novas instâncias
    const instanceId = instance.id === "1" ? undefined : instance.id;
    
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
    // Explicitamente tipar o status como WhatsAppStatus para garantir compatibilidade com o enum do banco de dados
    const whatsappData = {
      id: instanceId, // Deixa o Supabase gerar ID para novos registros
      instance_name: instance.instanceName,
      phone: "", // Será atualizado quando conectado
      company_id: companyId,
      status: "connecting" as WhatsAppStatus, // Explicitamente definido como um dos valores permitidos
      qr_code: qrCodeUrl,
      instance_id: result.instanceId,
      evolution_instance_name: result.instanceName
    };
    
    console.log("Dados a serem salvos no banco:", whatsappData);
    
    const { error, data } = await supabase
      .from('whatsapp_numbers')
      .upsert(whatsappData, { onConflict: 'instance_name' })
      .select();  // Retorna os dados inseridos/atualizados
  
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
  if (instanceId === "1") return; // Pula atualização de BD para ID placeholder
  
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

// Atualiza estado local da instância
export const updateLocalInstanceState = (
  instance: WhatsAppInstance | string,
  updatedDbInstance: any = null,
  qrCodeUrl?: string
) => {
  const instanceId = typeof instance === 'string' ? instance : instance.id;
  const oldInstance = typeof instance === 'string' ? null : instance;
  
  // Se tivermos tanto a instância antiga quanto o registro atualizado do banco
  if (oldInstance && updatedDbInstance) {
    return {
      id: updatedDbInstance.id,
      instanceName: updatedDbInstance.instance_name,
      connected: false,
      qrCodeUrl
    };
  }
  
  // Se estivermos apenas atualizando o estado de conexão ou QR code de uma instância existente
  return {
    connected: false,
    qrCodeUrl
  };
};

// Atualiza QR code no banco de dados
export const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
  if (instanceId === "1") return; // Pula atualização de BD para ID placeholder
  
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
