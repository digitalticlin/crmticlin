
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PLAN-LIMIT-CHECKER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error("user_id is required");
    }

    logStep("Checking limits for user", { user_id });

    // Buscar uso atual do período
    const { data: usage, error } = await supabaseClient
      .from('message_usage_tracking')
      .select('*')
      .eq('user_id', user_id)
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
        percentage_used: 100,
        status: 'blocked',
        error: 'No active plan found'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const remaining = Math.max(0, usage.plan_limit - usage.total_messages_count);
    const percentage_used = (usage.total_messages_count / usage.plan_limit) * 100;

    // Determinar status atual
    let status = 'active';
    if (percentage_used >= 100) status = 'blocked';
    else if (percentage_used >= 90) status = 'exceeded';
    else if (percentage_used >= 75) status = 'warning';

    const result = {
      allowed: remaining > 0,
      remaining,
      current_usage: usage.total_messages_count,
      plan_limit: usage.plan_limit,
      percentage_used: Math.round(percentage_used * 100) / 100,
      status,
      plan_type: usage.plan_subscription_id
    };

    logStep("Limit check completed", result);

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
      percentage_used: 100,
      status: 'blocked',
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
