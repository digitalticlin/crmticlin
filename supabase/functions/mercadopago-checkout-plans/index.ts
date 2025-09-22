import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-CHECKOUT-PLANS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verificar se a chave do Mercado Pago está configurada
    const mercadoPagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadoPagoAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    // Autenticar usuário
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Obter dados do plano
    const { plan_type, plan_name, price_amount, message_limit } = await req.json();

    if (!plan_type || !plan_name || !price_amount || !message_limit) {
      throw new Error("Missing required plan data");
    }

    logStep("Plan data received", { plan_type, plan_name, price_amount, message_limit });

    // Verificar se pode usar plano gratuito
    if (plan_type === 'free_200') {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: canUseTrial } = await supabaseService.rpc('can_use_free_trial', {
        p_user_id: user.id
      });

      if (!canUseTrial) {
        throw new Error("Trial gratuito já foi utilizado ou usuário já teve plano pago");
      }

      // Ativar trial gratuito diretamente
      const { error: trialError } = await supabaseService
        .from('free_trial_usage')
        .insert({
          user_id: user.id,
          messages_limit: 200,
          activated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (trialError) {
        throw new Error(`Erro ao ativar trial: ${trialError.message}`);
      }

      logStep("Free trial activated", { userId: user.id });

      return new Response(JSON.stringify({
        success: true,
        is_trial: true,
        message: "Trial gratuito ativado com sucesso",
        trial_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Criar preferência de pagamento no Mercado Pago
    const preferenceData = {
      items: [
        {
          title: plan_name,
          description: `${message_limit.toLocaleString()} mensagens por mês`,
          unit_price: price_amount,
          quantity: 1,
          currency_id: "BRL"
        }
      ],
      payer: {
        email: user.email
      },
      back_urls: {
        success: `${req.headers.get("origin")}/plans?success=true`,
        failure: `${req.headers.get("origin")}/plans?failure=true`,
        pending: `${req.headers.get("origin")}/plans?pending=true`
      },
      auto_return: "approved",
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      external_reference: user.id, // ID do usuário
      metadata: {
        user_id: user.id,
        plan_type: plan_type,
        message_limit: message_limit.toString(),
        user_email: user.email
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12
      },
      statement_descriptor: "CRM Ticlin"
    };

    logStep("Creating MercadoPago preference", {
      items: preferenceData.items,
      user_email: user.email
    });

    // Fazer requisição para API do Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mercadoPagoAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      logStep("MercadoPago API Error", {
        status: mpResponse.status,
        error: errorText
      });
      throw new Error(`MercadoPago API Error: ${mpResponse.status} - ${errorText}`);
    }

    const preferenceResult = await mpResponse.json();

    logStep("MercadoPago preference created", {
      preferenceId: preferenceResult.id,
      init_point: preferenceResult.init_point
    });

    // Salvar preferência no banco para referência
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseService
      .from('plan_subscriptions')
      .upsert({
        user_id: user.id,
        plan_type: plan_type,
        status: 'pending',
        mercadopago_preference_id: preferenceResult.id,
        current_period_start: null,
        current_period_end: null,
        created_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: true,
      preference_id: preferenceResult.id,
      init_point: preferenceResult.init_point,
      sandbox_init_point: preferenceResult.sandbox_init_point
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