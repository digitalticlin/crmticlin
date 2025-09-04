import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const aiAgentApiKey = Deno.env.get("AI_AGENT_API_KEY");
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const headerApiKey = req.headers.get("x-api-key") || req.headers.get("X-Api-Key") || req.headers.get("apikey") || req.headers.get("APIKEY") || null;
    const body = await req.json();
    // Autenticação flexível
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : null;
    const isBearerValid = !!bearerToken && !!aiAgentApiKey && bearerToken === aiAgentApiKey;
    const isBodyKeyValid = !!body.apiKey && !!aiAgentApiKey && body.apiKey === aiAgentApiKey;
    const isHeaderKeyValid = !!headerApiKey && !!aiAgentApiKey && headerApiKey === aiAgentApiKey;
    if (!isBearerValid && !isBodyKeyValid && !isHeaderKeyValid) {
      return json({
        success: false,
        error: "API Key inválida ou ausente"
      }, 401);
    }
    if (!body.createdByUserId) {
      return json({
        success: false,
        error: "createdByUserId é obrigatório"
      }, 400);
    }
    if (!body.leadId) {
      return json({
        success: false,
        error: "leadId é obrigatório"
      }, 400);
    }
    const limit = clampNumber(body.limit ?? 30, 1, 100);
    const order = body.order === "asc" ? "asc" : "desc";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Processamento assíncrono direto - buscar mensagens por leadId
    const { data: msgs, error: msgsErr } = await Promise.race([
      supabase
        .from("messages")
        .select("id, text, from_me, timestamp, media_type, ai_description")
        .eq("lead_id", body.leadId)
        .eq("created_by_user_id", body.createdByUserId)
        .order("timestamp", { ascending: order === "asc" })
        .limit(limit),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout: Consulta demorou mais que 25 segundos")), 25000)
      )
    ]);
    if (msgsErr) {
      return json({
        success: false,
        error: `Erro ao buscar mensagens: ${msgsErr.message}`
      }, 500);
    }
    const messages = (msgs ?? []).map(formatMessage);
    return json({
      success: true,
      context: {
        leadId: body.leadId,
        order,
        limit: messages.length,
        processedAt: new Date().toISOString()
      },
      messages
    });
  } catch (err) {
    console.error("[ai_message_consult] ❌", err);
    
    // Tratamento específico para timeout
    if (err instanceof Error && err.message.includes("Timeout")) {
      return json({
        success: false,
        error: "Consulta excedeu o tempo limite",
        details: "A consulta demorou mais que 25 segundos e foi cancelada",
        timeout: true
      }, 408);
    }
    
    return json({
      success: false,
      error: "Erro interno do servidor",
      details: err?.message
    }, 500);
  }
});
function formatMessage(m) {
  const type = m.media_type ?? "text";
  const isMedia = type !== "text";
  return {
    id: m.id,
    fromMe: m.from_me === true,
    type,
    text: m.text ?? null,
    ...isMedia ? {
      base64url: m.ai_description ?? null
    } : {},
    timestamp: m.timestamp
  };
}
function clampNumber(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
