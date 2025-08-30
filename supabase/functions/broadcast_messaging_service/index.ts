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
    console.log("[BROADCAST] Request recebido:", requestBody);

    const {
      action,
      instanceId,
      campaignId,
      contacts,
      message,
      mediaType = "text",
      mediaUrl = null,
      rateLimitMs = 2000,
      scheduledFor = null
    } = requestBody;

    // Validação básica
    if (action !== "send_broadcast") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Action deve ser 'send_broadcast'"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!instanceId || !campaignId || !contacts || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Campos obrigatórios: instanceId, campaignId, contacts, message"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Garantir que contacts é array
    const contactsArray = Array.isArray(contacts) ? contacts : [contacts];

    if (contactsArray.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Lista de contatos não pode estar vazia"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[BROADCAST] Processando campanha ${campaignId} para ${contactsArray.length} contatos`);

    // Salvar campanha no database (opcional - para tracking)
    try {
      const { data: campaign, error: dbError } = await supabase
        .from('broadcast_campaigns')
        .insert({
          campaign_id: campaignId,
          instance_id: instanceId,
          message: message,
          media_type: mediaType,
          media_url: mediaUrl,
          contacts: contactsArray,
          total_contacts: contactsArray.length,
          status: 'queued',
          created_at: new Date().toISOString(),
          scheduled_for: scheduledFor
        })
        .select()
        .single();

      if (dbError) {
        console.log("[BROADCAST] Aviso: Erro ao salvar no DB:", dbError);
        // Continue mesmo com erro no DB
      }
    } catch (error) {
      console.log("[BROADCAST] Aviso: Erro no DB:", error);
      // Continue mesmo com erro no DB
    }

    // Enviar para fila na VPS
    const vpsPayload = {
      instanceId,
      campaignId,
      contacts: contactsArray,
      message,
      mediaType,
      mediaUrl,
      rateLimitMs: rateLimitMs || 2000,
      timestamp: new Date().toISOString()
    };

    console.log("[BROADCAST] Enviando para VPS queue:", VPS_URL);

    const vpsResponse = await fetch(`${VPS_URL}/queue/add-broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vpsPayload)
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error("[BROADCAST] Erro na VPS:", errorText);
      throw new Error(`VPS retornou erro: ${vpsResponse.status} - ${errorText}`);
    }

    const vpsResult = await vpsResponse.json();
    console.log("[BROADCAST] Resposta da VPS:", vpsResult);

    // Resposta de sucesso
    const response = {
      success: true,
      action: "send_broadcast",
      campaignId: campaignId,
      instanceId: instanceId,
      queued: contactsArray.length,
      jobId: vpsResult.jobId,
      mediaType: mediaType,
      rateLimitMs: rateLimitMs,
      vps_response: vpsResult,
      timestamp: new Date().toISOString()
    };

    console.log("[BROADCAST] Sucesso:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[BROADCAST] Erro geral:", error);

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