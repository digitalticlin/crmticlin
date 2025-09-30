import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CHECKOUT-PLANS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verificar se a chave da Stripe está configurada
    const stripeKey = Deno.env.get("STRIPE_APIKEY");
    if (!stripeKey) {
      throw new Error("STRIPE_APIKEY is not configured");
    }

    // ✅ DEBUG: Verificar se está usando chave de teste
    const isTestKey = stripeKey.startsWith("sk_test_");
    logStep("Stripe configuration", {
      isTestKey: isTestKey,
      keyPrefix: stripeKey.substring(0, 10) + "...",
      environment: isTestKey ? "TEST" : "LIVE"
    });

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { plan_id, user_id, context } = await req.json();

    if (!plan_id || !user_id) {
      throw new Error("Missing required parameters: plan_id or user_id");
    }

    logStep("Request data", { plan_id, user_id, context });

    // Mapa de planos com Price IDs da Stripe
    const planMap: Record<string, { name: string; price_id: string; message_limit: number }> = {
      'pro_5k': {
        name: 'Plano Profissional',
        price_id: 'price_1SCp3t7ISCuoutHEgWMN1d9t',
        message_limit: 5000
      },
      'ultra_15k': {
        name: 'Plano Ultra',
        price_id: 'price_1SCp4E7ISCuoutHEQXz86ghq',
        message_limit: 15000
      }
    };

    const planData = planMap[plan_id];
    if (!planData) {
      throw new Error(`Invalid plan_id: ${plan_id}`);
    }

    logStep("Plan data", planData);

    // ✅ Definir URLs de sucesso baseado no contexto
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:5173";

    const successUrl = context === 'register' ?
      `${origin}/confirm-email?plan=${plan_id}&session_id={CHECKOUT_SESSION_ID}` :
      `${origin}/plans?upgrade=success&plan=${plan_id}&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = context === 'register' ?
      `${origin}/register?plan=${plan_id}&canceled=true` :
      `${origin}/plans?upgrade=canceled`;

    logStep("Redirect URLs", {
      context,
      successUrl,
      cancelUrl
    });

    // Criar Checkout Session da Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: planData.price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user_id,
      metadata: {
        user_id: user_id,
        plan_type: plan_id,
        message_limit: planData.message_limit.toString(),
        context: context || 'register'
      },
      subscription_data: {
        metadata: {
          user_id: user_id,
          plan_type: plan_id,
          message_limit: planData.message_limit.toString(),
        },
      },
    });

    logStep("Stripe session created", {
      sessionId: session.id,
      url: session.url
    });

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      url: session.url
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