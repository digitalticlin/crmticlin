
import { supabase } from "@/integrations/supabase/client";
import { evolutionApiService } from "@/services/evolution-api";
import { WhatsAppStatus } from "@/hooks/whatsapp/database";
import { generateUniqueInstanceName } from "@/utils/whatsapp/instanceNameGenerator";
import type { CreateInstanceResponse } from "@/services/evolution-api/types";

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
  // Verifica se já existe uma instância pendente para o mesmo company_id
  try {
    // Obter dados do usuário
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

    // Verifique se já existe uma instância pendente (connecting/disconnected) com phone vazio
    const { data: pendingInstances, error: fetchError } = await supabase
      .from('whatsapp_numbers')
      .select('id, instance_name, status')
      .eq('company_id', companyId)
      .in('status', ['connecting', 'disconnected'])
      .or('phone.is.null,phone.eq.""');

    if (fetchError) {
      console.warn("Erro ao verificar instâncias pendentes (continuando):", fetchError);
    // Se houver erro, não bloqueia criação. Só loga.
    }
    if (pendingInstances && pendingInstances.length > 0) {
      return {
        success: false,
        error:
          "Já existe uma instância de WhatsApp pendente de conexão para sua empresa! Por favor, finalize ou exclua a anterior antes de criar outra.",
      };
    }

    // Novo: função auxiliar interna para tentar nomes sucessivos em caso de erro de nome em uso
    const tryCreateInstanceWithRetries = async (
      baseInstanceName: string,
      maxTries = 10
    ) => {
      let attempt = 0;
      let instanceName = baseInstanceName;
      let lastError: any = null;
      while (attempt < maxTries) {
        try {
          // Chama Evolution API para criar instância
          const response = await evolutionApiService.createInstance(instanceName);

          // Corrige: acessar as propriedades com base no que EvolutionInstance retorna (não .instance!)
          if (
            !response ||
            !response.qrcode ||
            !response.qrcode.base64 ||
            !response.instanceId
          ) {
            throw new Error("QR code ou dados ausentes na resposta da API");
          }

          // Extrai QR e IDs necessários
          const qrCode = response.qrcode.base64;
          const instanceIdFromEvolution = response.instanceId;
          const evolutionInstanceName = response.instanceName;

          // Salva (insert) no banco
          const whatsappData = {
            instance_name: instanceName,
            phone: "",
            company_id: companyId,
            status: "connecting" as WhatsAppStatus,
            qr_code: qrCode,
            instance_id: instanceIdFromEvolution,
            evolution_instance_name: evolutionInstanceName,
            evolution_token: response.hash || "",
          };

          const { data: insertData, error: dbError } = await supabase
            .from('whatsapp_numbers')
            .insert(whatsappData)
            .select();

          if (dbError) {
            throw new Error("Erro ao salvar a instância no banco");
          }

          const saved = insertData && Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : null;

          return {
            success: true,
            qrCode,
            instanceName,
            instanceId: saved?.id || instanceIdFromEvolution,
          };
        } catch (error: any) {
          lastError = error;
          // Analisa se o erro é de nome já em uso pela Evolution API
          if (error && error.response && error.response.status === 403) {
            const respMessage = Array.isArray(error.response?.response?.message)
              ? error.response?.response?.message[0] || ""
              : error.response?.response?.message || "";

            if (
              typeof respMessage === "string" &&
              respMessage.includes("already in use")
            ) {
              // Incrementa o sufixo e tenta novamente
              attempt += 1;
              instanceName =
                attempt === 1
                  ? `${baseInstanceName}1`
                  : `${baseInstanceName}${attempt}`;
              continue; // tenta novamente
            }
          }
          // Para outros erros, retorna imediatamente
          break;
        }
      }
      // Se saiu do laço, retorna erro
      return {
        success: false,
        error:
          lastError?.message ||
          "Não foi possível criar uma instância disponível (nomes já em uso)",
      };
    };

    // Gera nome único para a instância inicialmente
    const uniqueInstanceName = await generateUniqueInstanceName(username);
    console.log("Unique instance name generated:", uniqueInstanceName);

    // Tenta criar a instância, incrementando se necessário
    const result = await tryCreateInstanceWithRetries(uniqueInstanceName, 10);

    return result;
  } catch (error: any) {
    console.error("Erro completo ao criar instância:", error);
    return {
      success: false,
      error: error.message || "Erro ao criar a instância WhatsApp"
    };
  }
};
