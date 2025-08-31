import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {
    headers: corsHeaders
  });
  
  if (req.method !== "POST") return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders
  });
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const aiAgentApiKey = Deno.env.get("AI_AGENT_API_KEY");
    
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const headerApiKey = req.headers.get("x-api-key") || req.headers.get("X-Api-Key") || req.headers.get("apikey") || req.headers.get("APIKEY") || null;
    const body = await req.json();
    
    // Autenticação flexível: aceitar Authorization: Bearer <AI_AGENT_API_KEY> OU body.apiKey (qualquer um válido)
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
    
    if (!body.createdByUserId) return json({
      success: false,
      error: "createdByUserId é obrigatório"
    }, 400);
    
    if (!body.leadId && (!body.phone || !body.instanceId)) {
      return json({
        success: false,
        error: "Informe leadId OU (phone e instanceId)"
      }, 400);
    }
    
    const limit = clampNumber(body.limit ?? 30, 1, 100);
    const order = body.order === "asc" ? "asc" : "desc";
    const mode = body.mode === "sync" ? "sync" : "queue";
    const hasWebhook = typeof body.webhookUrl === "string" && body.webhookUrl.trim().length > 0;
    const effectiveMode = mode === "queue" && !hasWebhook ? "sync" : mode;
    const phone = (body.phone ?? "").replace(/\D/g, "");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (effectiveMode === "queue") {
      if (!body.webhookUrl) return json({
        success: false,
        error: "webhookUrl é obrigatório no modo fila"
      }, 400);
      
      const requestId = `consult_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const msg = {
        apiKey: body.apiKey,
        leadId: body.leadId ?? "",
        instanceId: body.instanceId,
        createdByUserId: body.createdByUserId,
        limit,
        order,
        webhookUrl: body.webhookUrl,
        requestId,
        enqueuedAt: new Date().toISOString(),
        type: "ai_message_consult"
      };
      
      const { error: qErr } = await supabase.rpc("pgmq_send", {
        queue_name: "ai_message_consult_queue",
        msg
      });
      
      if (qErr) return json({
        success: false,
        error: `Falha ao enfileirar: ${qErr.message}`
      }, 500);
      
      return json({
        success: true,
        queued: true,
        status: "accepted",
        jobId: requestId,
        queue: "ai_message_consult_queue"
      }, 202);
    }
    
    // Modo síncrono (fallback/controlado)
    const resolution = body.leadId ? 
      await resolveLeadById(supabase, body.createdByUserId, body.instanceId, body.leadId) : 
      await resolveLeadByPhoneInstance(supabase, body.createdByUserId, body.instanceId, phone);
      
    if (!resolution.success) return json(resolution, resolution.statusCode || 400);
    
    const { lead, instance } = resolution.data;
    
    // ✅ CORREÇÃO: Usar ai_description em vez de base64_data
    const { data: msgs, error: msgsErr } = await supabase
      .from("messages")
      .select("id, text, from_me, timestamp, media_type, ai_description")
      .eq("lead_id", lead.id)
      .eq("created_by_user_id", body.createdByUserId)
      .order("timestamp", { ascending: order === "asc" })
      .limit(limit);
      
    if (msgsErr) return json({
      success: false,
      error: `Erro ao buscar mensagens: ${msgsErr.message}`
    }, 500);
    
    const messages = (msgs ?? []).map(formatMessage);
    
    return json({
      success: true,
      context: {
        instanceId: instance.id,
        instanceName: instance.instance_name ?? null,
        leadId: lead.id,
        leadName: lead.name,
        phone: lead.phone,
        order,
        limit: messages.length,
        mode: effectiveMode
      },
      messages
    });
    
  } catch (err) {
    console.error("[ai_message_consult] ❌", err);
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
    // ✅ CORREÇÃO: Usar ai_description em vez de base64_data
    ...isMedia ? {
      base64url: m.ai_description ?? null
    } : {},
    timestamp: m.timestamp
  };
}

async function resolveLeadByPhoneInstance(supabase, userId, instanceId, phone) {
  const { data: instance, error: instErr } = await supabase
    .from("whatsapp_instances")
    .select("id, created_by_user_id, instance_name")
    .eq("id", instanceId)
    .eq("created_by_user_id", userId)
    .single();
    
  if (instErr || !instance) return {
    success: false,
    error: "Instância não encontrada ou não autorizada",
    statusCode: 404
  };
  
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, phone, name, whatsapp_number_id, created_by_user_id")
    .eq("created_by_user_id", userId)
    .eq("whatsapp_number_id", instance.id)
    .eq("phone", phone)
    .single();
    
  if (leadErr || !lead) return {
    success: false,
    error: "Lead não encontrado para este phone/instância",
    statusCode: 404
  };
  
  return {
    success: true,
    data: { lead, instance }
  };
}

async function resolveLeadById(supabase, userId, instanceId, leadId) {
  // Validar instância pertence ao usuário
  const { data: instance, error: instErr } = await supabase
    .from("whatsapp_instances")
    .select("id, created_by_user_id, instance_name")
    .eq("id", instanceId)
    .eq("created_by_user_id", userId)
    .single();
    
  if (instErr || !instance) return {
    success: false,
    error: "Instância não encontrada ou não autorizada",
    statusCode: 404
  };
  
  // Buscar lead e validar que pertence ao usuário e está vinculado à instância
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, phone, name, whatsapp_number_id, created_by_user_id")
    .eq("id", leadId)
    .eq("created_by_user_id", userId)
    .single();
    
  if (leadErr || !lead) return {
    success: false,
    error: "Lead não encontrado ou não autorizado",
    statusCode: 404
  };
  
  if (lead.whatsapp_number_id !== instance.id) {
    return {
      success: false,
      error: "Lead não pertence à instância informada",
      statusCode: 400
    };
  }
  
  return {
    success: true,
    data: { lead, instance }
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