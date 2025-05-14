
import { supabase } from "@/integrations/supabase/client";
import { evolutionApiService } from "@/services/evolution-api";
import { WhatsAppStatus } from "@/hooks/whatsapp/database";
import { generateUniqueInstanceName } from "@/utils/whatsapp/instanceNameGenerator";

/**
 * Cria nova instância WhatsApp e salva no banco, retorna QR code.
 */
export const createWhatsAppInstance = async (username: string): Promise<{
  success: boolean;
  qrCode?: string;
  instanceName?: string;
  instanceId?: string;
  error?: string;
}> => {
  try {
    // Gera nome único para a instância
    const uniqueInstanceName = await generateUniqueInstanceName(username);
    console.log("Unique instance name generated:", uniqueInstanceName);

    // Busca company_id do usuário atual
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error("Erro ao obter dados do usuário");
    const userId = userData.user?.id;

    // Busca perfil do usuário p/ company_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profileData?.company_id)
      throw new Error("Erro ao obter a empresa do usuário");

    const companyId = profileData.company_id;

    // Chama Evolution API (POST para criar instância, com API-KEY correta)
    const response = await evolutionApiService.createInstance(uniqueInstanceName);

    if (!response || !response.qrcode || !response.qrcode.base64 || !response.instance?.instanceId) {
      throw new Error("QR code ou dados ausentes na resposta da API");
    }

    // Extrai QR e IDs necessários
    const qrCode = response.qrcode.base64;
    const instanceIdFromEvolution = response.instance.instanceId;
    const evolutionInstanceName = response.instance.instanceName;

    // Salva no Supabase
    const whatsappData = {
      instance_name: uniqueInstanceName,
      phone: "", // Atualiza depois se precisar
      company_id: companyId,
      status: "connecting" as WhatsAppStatus,
      qr_code: qrCode,
      instance_id: instanceIdFromEvolution,
      evolution_instance_name: evolutionInstanceName,
      evolution_token: response.hash || ""
    };

    // Salva (insert) no banco
    const { data: insertData, error: dbError } = await supabase
      .from('whatsapp_numbers')
      .insert(whatsappData)
      .select();

    if (dbError) {
      console.error("Erro ao salvar instância no banco:", dbError);
      throw new Error("Erro ao salvar a instância no banco");
    }

    // Retorna info para UI consumir (id do registro salvo)
    const saved = insertData && Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : null;

    return {
      success: true,
      qrCode,
      instanceName: uniqueInstanceName,
      instanceId: saved?.id || instanceIdFromEvolution,
    };
  } catch (error: any) {
    console.error("Erro completo ao criar instância:", error);
    return {
      success: false,
      error: error.message || "Erro ao criar a instância WhatsApp"
    };
  }
};
