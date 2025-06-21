
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebResult, WhatsAppConnectionStatus } from "@/types/whatsapp";

interface SaveInstanceParams {
  instanceName: string;
  phone: string;
  userId: string;
  connectionStatus: WhatsAppConnectionStatus;
  connectionType: "web";
  serverUrl: string;
  vpsInstanceId: string;
  webStatus: string;
  qrCode: string;
  sessionData: WhatsAppWebResult;
}

export async function saveInstanceToDatabase({
  instanceName,
  phone,
  userId,
  connectionStatus,
  connectionType,
  serverUrl,
  vpsInstanceId,
  webStatus,
  qrCode,
  sessionData,
}: SaveInstanceParams): Promise<string> {
  try {
    console.log("💾 Salvando instância no banco de dados:", {
      instanceName,
      phone,
      userId,
      connectionStatus,
      connectionType,
      serverUrl,
      vpsInstanceId,
      webStatus: webStatus?.substring(0, 50),
      qrCodeLength: qrCode?.length || 0,
      sessionDataKeys: sessionData ? Object.keys(sessionData) : [],
    });

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, created_by_user_id")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("❌ Erro ao buscar usuário:", userError);
      throw new Error(`Usuário não encontrado: ${userError.message}`);
    }

    if (!userData) {
      throw new Error("Dados do usuário não encontrados");
    }

    console.log("✅ Usuário encontrado:", userData);

    // Usar created_by_user_id instead of company_id
    const createdByUserId = userData.created_by_user_id || userId;

    // Verificar se já existe uma instância com o mesmo nome
    const { data: existingInstance } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name", instanceName)
      .eq("created_by_user_id", createdByUserId)
      .single();

    if (existingInstance) {
      console.log("📝 Atualizando instância existente:", existingInstance.id);
      
      const { data: updatedInstance, error: updateError } = await supabase
        .from("whatsapp_instances")
        .update({
          phone,
          connection_status: connectionStatus,
          connection_type: connectionType,
          server_url: serverUrl,
          vps_instance_id: vpsInstanceId,
          web_status: webStatus,
          qr_code: qrCode,
          session_data: sessionData as any, // Cast to any for Json compatibility
          updated_at: new Date().toISOString(),
          date_connected: connectionStatus === "connected" ? new Date().toISOString() : null,
        })
        .eq("id", existingInstance.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Erro ao atualizar instância:", updateError);
        throw updateError;
      }

      console.log("✅ Instância atualizada com sucesso:", updatedInstance.id);
      return updatedInstance.id;
    }

    // Criar nova instância
    console.log("🆕 Criando nova instância...");
    
    const { data: newInstance, error: insertError } = await supabase
      .from("whatsapp_instances")
      .insert({
        instance_name: instanceName,
        phone,
        created_by_user_id: createdByUserId,
        connection_status: connectionStatus,
        connection_type: connectionType,
        server_url: serverUrl,
        vps_instance_id: vpsInstanceId,
        web_status: webStatus,
        qr_code: qrCode,
        session_data: sessionData as any, // Cast to any for Json compatibility
        date_connected: connectionStatus === "connected" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erro ao criar instância:", insertError);
      throw insertError;
    }

    console.log("✅ Nova instância criada com sucesso:", newInstance.id);
    return newInstance.id;

  } catch (error) {
    console.error("💥 Erro geral ao salvar instância:", error);
    throw error;
  }
}

export const getCurrentUserId = async (): Promise<string> => {
  const userResult = await supabase.auth.getUser();
  const userId = userResult.data.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return userId;
};
