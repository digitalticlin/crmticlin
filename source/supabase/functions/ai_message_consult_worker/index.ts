import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const workerKey = Deno.env.get("AI_AGENT_WORKER_KEY");
    const aiAgentApiKey = Deno.env.get("AI_AGENT_API_KEY");
    const auth = req.headers.get("authorization") || req.headers.get("x-worker-key");

    // Permitir autenticação via worker key OU via Bearer AI_AGENT_API_KEY
    const isWorkerKeyValid = !!workerKey && (auth === `Bearer ${workerKey}` || auth === workerKey);
    const isAgentBearerValid = !!aiAgentApiKey && auth === `Bearer ${aiAgentApiKey}`;
    if (!isWorkerKeyValid && !isAgentBearerValid) {
      return json({ success: false, error: "Não autorizado" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { batchSize = 10, visibilityTimeout = 30 } = await req.json().catch(() => ({}));

    const { data: readData, error: readErr } = await supabase.rpc("pgmq_read", {
      queue_name: "ai_message_consult_queue",
      vt: visibilityTimeout,
      qty: batchSize,
    });

    if (readErr) return json({ success: false, error: `pgmq_read: ${readErr.message}` }, 500);
    const items: Array<{ msg: any; vt: number; read_ct: number; enqueued_at: string; msg_id: number }> = readData || [];

    let processed = 0, delivered = 0, failed = 0;
    for (const item of items) {
      const payload = item.msg;
      try {
        const result = await processConsult(supabase, payload);
        const resp = await fetch(payload.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });

        if (resp.ok) {
          await supabase.rpc("pgmq_delete", { queue_name: "ai_message_consult_queue", msg_id: item.msg_id });
          delivered++;
        } else {
          failed++;
        }
        processed++;
      } catch (e) {
        console.error("[ai_message_consult_worker] erro item:", e);
        failed++;
      }
    }

    return json({ success: true, processed, delivered, failed });
  } catch (err: any) {
    console.error("[ai_message_consult_worker] ❌", err);
    return json({ success: false, error: "Erro interno do servidor", details: err?.message }, 500);
  }
});

async function processConsult(supabase: any, p: any) {
  const resolution = p.leadId
    ? await resolveLeadById(supabase, p.createdByUserId, p.instanceId, p.leadId)
    : await resolveLeadByPhoneInstance(supabase, p.createdByUserId, p.instanceId, p.phone);
  if (!resolution.success) {
    return { success: false, jobId: p.requestId, error: resolution.error, statusCode: resolution.statusCode || 400 };
  }
  const { lead, instance } = resolution.data;

  const { data: msgs, error: msgsErr } = await supabase
    .from("messages")
    .select("id, text, from_me, timestamp, media_type, base64_data")
    .eq("lead_id", lead.id)
    .eq("created_by_user_id", p.createdByUserId)
    .order("timestamp", { ascending: p.order === "asc" })
    .limit(p.limit);

  if (msgsErr) return { success: false, jobId: p.requestId, error: `Erro ao buscar mensagens: ${msgsErr.message}` };

  const messages = (msgs ?? []).map(formatMessage);

  return {
    success: true,
    jobId: p.requestId,
    context: {
      instanceId: instance.id,
      instanceName: instance.instance_name ?? null,
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      order: p.order,
      limit: messages.length,
      mode: "queue",
      enqueuedAt: p.enqueuedAt,
      deliveredAt: new Date().toISOString(),
    },
    messages,
  };
}

function formatMessage(m: any) {
  const type = (m.media_type ?? "text") as "text" | "image" | "video" | "audio" | "document";
  const isMedia = type !== "text";
  return {
    id: m.id,
    fromMe: m.from_me === true,
    type,
    text: m.text ?? null,
    ...(isMedia ? { base64url: m.base64_data ?? null } : {}),
    timestamp: m.timestamp,
  };
}

async function resolveLeadByPhoneInstance(supabase: any, userId: string, instanceId: string, phone: string) {
  const { data: instance, error: instErr } = await supabase
    .from("whatsapp_instances")
    .select("id, created_by_user_id, instance_name")
    .eq("id", instanceId)
    .eq("created_by_user_id", userId)
    .single();
  if (instErr || !instance) return { success: false, error: "Instância não encontrada ou não autorizada", statusCode: 404 };

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, phone, name, whatsapp_number_id, created_by_user_id")
    .eq("created_by_user_id", userId)
    .eq("whatsapp_number_id", instance.id)
    .eq("phone", phone)
    .single();
  if (leadErr || !lead) return { success: false, error: "Lead não encontrado para este phone/instância", statusCode: 404 };

  return { success: true, data: { lead, instance } };
}

async function resolveLeadById(supabase: any, userId: string, instanceId: string, leadId: string) {
  const { data: instance, error: instErr } = await supabase
    .from("whatsapp_instances")
    .select("id, created_by_user_id, instance_name")
    .eq("id", instanceId)
    .eq("created_by_user_id", userId)
    .single();
  if (instErr || !instance) return { success: false, error: "Instância não encontrada ou não autorizada", statusCode: 404 };

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, phone, name, whatsapp_number_id, created_by_user_id")
    .eq("id", leadId)
    .eq("created_by_user_id", userId)
    .single();
  if (leadErr || !lead) return { success: false, error: "Lead não encontrado ou não autorizado", statusCode: 404 };

  if (lead.whatsapp_number_id !== instance.id) {
    return { success: false, error: "Lead não pertence à instância informada", statusCode: 400 };
  }
  return { success: true, data: { lead, instance } };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


