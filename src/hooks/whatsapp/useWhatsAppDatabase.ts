
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppInstance } from "./whatsappInstanceStore";

// Salva instância no banco de dados
export const saveInstanceToDatabase = async (
  instance: WhatsAppInstance, 
  qrCodeUrl: string, 
  result: any
) => {
  console.log(`Salvando instância no banco de dados: ${instance.instanceName}`);
  
  try {
    // Gere um UUID aleatório para novas instâncias
    const instanceId = instance.id === "1" ? undefined : instance.id;
    
    // Obter o ID da empresa do usuário atual
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error("Erro ao obter dados do usuário atual");
    }
    
    const userId = userData.user?.id;
    
    // Obter o company_id do perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      throw new Error("Erro ao obter perfil do usuário");
    }
    
    const companyId = profileData.company_id;
    
    if (!companyId) {
      throw new Error("Usuário não está associado a uma empresa");
    }
    
    const { error, data } = await supabase
      .from('whatsapp_numbers')
      .upsert({
        id: instanceId, // Deixa o Supabase gerar ID para novos registros
        instance_name: instance.instanceName,
        phone: "", // Será atualizado quando conectado
        company_id: companyId,
        status: "connecting",
        qr_code: qrCodeUrl,
        instance_id: result.instanceId,
        evolution_instance_name: result.instanceName
      }, { onConflict: 'instance_name' })
      .select();  // Retorna os dados inseridos/atualizados
  
    if (error) {
      console.error("Erro ao salvar instância no banco de dados:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      // Busca o registro inserido/atualizado se select não o retornou
      const { data: fetchedData, error: fetchError } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('instance_name', instance.instanceName)
        .limit(1);
        
      if (fetchError || !fetchedData || fetchedData.length === 0) {
        throw new Error("Erro ao recuperar instância após salvamento");
      }
      
      return fetchedData[0];
    }
    
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
      status: 'disconnected',
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
  
  const { error } = await supabase
    .from('whatsapp_numbers')
    .update({ 
      qr_code: qrCodeUrl,
      status: 'connecting'
    })
    .eq('id', instanceId);
    
  if (error) {
    console.error("Erro ao atualizar QR code no banco de dados:", error);
    throw error;
  }
};
