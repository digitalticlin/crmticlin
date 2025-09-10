import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configurações Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração VPS
const VPS_URL = "http://164.92.74.252:3001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const requestBody = await req.json();
    console.log("[READ] Request recebido:", requestBody);

    const {
      action,
      instanceId,
      conversationId,
      messageIds,
      userId = "system"
    } = requestBody;

    // Validação básica
    if (action !== "mark_as_read") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Action deve ser 'mark_as_read'"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!instanceId || !conversationId || !messageIds) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos obrigatórios: instanceId, conversationId, messageIds"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Garantir que messageIds é array
    const messageIdsArray = Array.isArray(messageIds) ? messageIds : [messageIds];

    if (messageIdsArray.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Lista de messageIds não pode estar vazia"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[READ] Marcando ${messageIdsArray.length} mensagens como lidas - Conversa: ${conversationId}`);

    // Salvar no database para tracking (opcional)
    try {
      const { data: readLog, error: dbError } = await supabase
        .from('read_messages_log')
        .insert({
          instance_id: instanceId,
          conversation_id: conversationId,
          message_ids: messageIdsArray,
          user_id: userId,
          total_messages: messageIdsArray.length,
          status: 'queued',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.log("[READ] Aviso: Erro ao salvar no DB:", dbError);
        // Continue mesmo com erro no DB
      }
    } catch (error) {
      console.log("[READ] Aviso: Erro no DB:", error);
      // Continue mesmo com erro no DB
    }

    // Enviar para fila na VPS
    const vpsPayload = {
      instanceId,
      conversationId,
      messageIds: messageIdsArray,
      userId,
      timestamp: new Date().toISOString()
    };

    console.log("[READ] Enviando para VPS queue:", VPS_URL);

    const vpsResponse = await fetch(`${VPS_URL}/queue/mark-as-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vpsPayload)
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error("[READ] Erro na VPS:", errorText);
      throw new Error(`VPS retornou erro: ${vpsResponse.status} - ${errorText}`);
    }

    const vpsResult = await vpsResponse.json();
    console.log("[READ] Resposta da VPS:", vpsResult);

    // Resposta de sucesso
    const response = {
      success: true,
      action: "mark_as_read",
      conversationId: conversationId,
      instanceId: instanceId,
      markedCount: vpsResult.markedCount || messageIdsArray.length,
      skippedSent: vpsResult.skippedSent || 0,
      jobId: vpsResult.jobId,
      userId: userId,
      vps_response: vpsResult,
      timestamp: new Date().toISOString()
    };

    console.log("[READ] Sucesso:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[READ] Erro geral:", error);

    const errorResponse = {
      success: false,
      error: error.message || "Erro interno do servidor",
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});