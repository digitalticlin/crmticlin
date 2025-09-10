
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MESSAGE-USAGE-TRACKER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Usar service role para operações administrativas
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { user_id, message_type = 'sent', increment = 1 } = await req.json();
    
    if (!user_id) {
      throw new Error("user_id is required");
    }

    logStep("Processing message increment", { user_id, message_type, increment });

    // Buscar tracking ativo do usuário
    const { data: usage, error: usageError } = await supabaseClient
      .from('message_usage_tracking')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .gte('period_end', new Date().toISOString())
      .single();

    if (usageError || !usage) {
      logStep("No active usage tracking found", { error: usageError });
      return new Response(JSON.stringify({
        success: false,
        error: "No active plan found for user"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Found active usage tracking", { usage_id: usage.id });

    // Calcular novos valores
    const newSentCount = message_type === 'sent' 
      ? usage.messages_sent_count + increment 
      : usage.messages_sent_count;
    
    const newReceivedCount = message_type === 'received' 
      ? usage.messages_received_count + increment 
      : usage.messages_received_count;

    const newTotalCount = newSentCount + newReceivedCount;
    const percentage_used = (newTotalCount / usage.plan_limit) * 100;

    // Determinar novo status
    let newStatus = 'active';
    if (percentage_used >= 100) newStatus = 'blocked';
    else if (percentage_used >= 90) newStatus = 'exceeded';  
    else if (percentage_used >= 75) newStatus = 'warning';

    logStep("Calculated new values", {
      newSentCount,
      newReceivedCount, 
      newTotalCount,
      percentage_used,
      newStatus
    });

    // Atualizar contador
    const { error: updateError } = await supabaseClient
      .from('message_usage_tracking')
      .update({
        messages_sent_count: newSentCount,
        messages_received_count: newReceivedCount,
        total_messages_count: newTotalCount,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', usage.id);

    if (updateError) {
      throw new Error(`Failed to update usage: ${updateError.message}`);
    }

    logStep("Usage updated successfully");

    // Verificar se precisa criar alertas
    if (newStatus !== 'active') {
      const alertType = newStatus === 'blocked' ? 'limit_reached' :
                       newStatus === 'exceeded' ? 'warning_90' : 'warning_75';

      // Verificar se alerta já foi enviado
      const { data: existingAlert } = await supabaseClient
        .from('usage_alerts')
        .select('id')
        .eq('user_id', user_id)
        .eq('alert_type', alertType)
        .eq('acknowledged', false)
        .single();

      if (!existingAlert) {
        // Criar novo alerta
        await supabaseClient
          .from('usage_alerts')
          .insert({
            user_id,
            alert_type: alertType,
            current_usage: newTotalCount,
            plan_limit: usage.plan_limit,
            percentage_used: Math.round(percentage_used * 100) / 100
          });

        logStep("Alert created", { alertType });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      usage: {
        total_messages_count: newTotalCount,
        messages_sent_count: newSentCount,
        messages_received_count: newReceivedCount,
        plan_limit: usage.plan_limit,
        percentage_used: Math.round(percentage_used * 100) / 100,
        status: newStatus,
        remaining: Math.max(0, usage.plan_limit - newTotalCount)
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
