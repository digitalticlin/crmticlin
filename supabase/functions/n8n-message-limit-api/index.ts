
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[N8N-MESSAGE-LIMIT-API] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("N8N API request started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { user_id, vps_instance_id, phone } = await req.json();
    
    if (!user_id && !vps_instance_id) {
      throw new Error("user_id or vps_instance_id is required");
    }

    logStep("Request data", { user_id, vps_instance_id, phone });

    let finalUserId = user_id;

    // Se não tem user_id, buscar pelo vps_instance_id
    if (!finalUserId && vps_instance_id) {
      const { data: instance } = await supabaseClient
        .from('whatsapp_instances')
        .select('created_by_user_id')
        .eq('vps_instance_id', vps_instance_id)
        .single();
      
      if (instance) {
        finalUserId = instance.created_by_user_id;
        logStep("Found user_id from instance", { finalUserId });
      }
    }

    if (!finalUserId) {
      throw new Error("Could not determine user_id");
    }

    // Verificar limite de mensagens
    const { data: usage, error } = await supabaseClient
      .from('message_usage_tracking')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('status', 'active')
      .gte('period_end', new Date().toISOString())
      .single();

    if (error || !usage) {
      logStep("No active plan found", { error: error?.message });
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        current_usage: 0,
        plan_limit: 0,
        status: 'no_plan',
        message: 'No active plan found for user'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const remaining = Math.max(0, usage.plan_limit - usage.total_messages_count);
    const percentage_used = (usage.total_messages_count / usage.plan_limit) * 100;
    const allowed = remaining > 0;

    const result = {
      allowed,
      remaining,
      current_usage: usage.total_messages_count,
      plan_limit: usage.plan_limit,
      percentage_used: Math.round(percentage_used * 100) / 100,
      status: usage.status,
      user_id: finalUserId
    };

    logStep("Limit check result", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      allowed: false,
      remaining: 0,
      current_usage: 0,
      plan_limit: 0,
      status: 'error',
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
