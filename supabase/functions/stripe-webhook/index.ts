import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_APIKEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("STRIPE_APIKEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verificar assinatura se webhook secret estiver configurado
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          webhookSecret
        );
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: corsHeaders
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("Webhook without signature verification");
    }

    logStep("Event type", { type: event.type });

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  try {
    logStep("Processing checkout completed", {
      sessionId: session.id,
      userId: session.client_reference_id,
      subscriptionId: session.subscription
    });

    const userId = session.client_reference_id || session.metadata?.user_id;
    const planType = session.metadata?.plan_type;
    const subscriptionId = session.subscription as string;

    if (!userId || !planType) {
      throw new Error("Missing user_id or plan_type in session metadata");
    }

    // Determinar member_limit baseado no plano
    const memberLimit = planType === 'pro_5k' ? 3 : (planType === 'ultra_15k' ? 999 : 0);
    const messageLimit = planType === 'pro_5k' ? 5000 : (planType === 'ultra_15k' ? 15000 : 0);

    // Ativar plano (usar update pois registro já existe via trigger)
    const { error } = await supabase
      .from('plan_subscriptions')
      .update({
        plan_type: planType,
        status: 'active',
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: session.customer as string,
        member_limit: memberLimit,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_payment_date: new Date().toISOString(),
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      logStep("Error updating subscription", { error: error.message, errorDetails: error });
      throw new Error(`Failed to update subscription: ${error.message || JSON.stringify(error)}`);
    }

    // Atualizar/Criar message_usage_tracking com novo limite de mensagens
    const { error: trackingError } = await supabase
      .from('message_usage_tracking')
      .upsert({
        user_id: userId,
        plan_limit: messageLimit,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        messages_sent_count: 0,
        messages_received_count: 0,
        total_messages_count: 0,
        ai_messages_sent: 0,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (trackingError) {
      logStep("Error updating message_usage_tracking", { error: trackingError.message });
    }

    logStep("Subscription activated", { userId, planType, memberLimit, messageLimit });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR in handleCheckoutCompleted", {
      message: errorMessage,
      stack: errorStack
    });
    throw error;
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription updated", {
    subscriptionId: subscription.id,
    status: subscription.status
  });

  const userId = subscription.metadata?.user_id;
  if (!userId) {
    logStep("No user_id in subscription metadata");
    return;
  }

  const statusMap: Record<string, string> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'past_due',
    'trialing': 'trialing'
  };

  // ✅ Validar timestamp antes de converter
  let periodEnd = null;
  if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
    try {
      periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    } catch (e) {
      logStep("Invalid timestamp for current_period_end", {
        value: subscription.current_period_end,
        error: e.message
      });
      periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Fallback: 30 dias
    }
  }

  const { error } = await supabase
    .from('plan_subscriptions')
    .update({
      status: statusMap[subscription.status] || subscription.status,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    logStep("Error updating subscription status", { error: error.message });
  }
}

async function handleSubscriptionCanceled(supabase: any, subscription: Stripe.Subscription) {
  logStep("Processing subscription canceled", {
    subscriptionId: subscription.id
  });

  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  await supabase
    .from('plan_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  logStep("Subscription marked as canceled", { userId });
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  logStep("Processing payment succeeded", {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency
  });

  if (!invoice.subscription) return;

  const { data: subscription } = await supabase
    .from('plan_subscriptions')
    .select('user_id, plan_type')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (!subscription) {
    logStep("Subscription not found for invoice", { subscriptionId: invoice.subscription });
    return;
  }

  // Atualizar plan_subscriptions
  await supabase
    .from('plan_subscriptions')
    .update({
      last_payment_date: new Date().toISOString(),
      next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', subscription.user_id);

  // 🆕 Criar registro em payment_history
  const amountInReais = invoice.amount_paid / 100; // Stripe retorna em centavos
  const { error: paymentError } = await supabase
    .from('payment_history')
    .insert({
      user_id: subscription.user_id,
      payment_id: invoice.id,
      payment_method: invoice.payment_intent ? 'credit_card' : 'stripe',
      status: 'approved',
      amount: amountInReais,
      plan_type: subscription.plan_type,
      gateway: 'stripe',
      gateway_response: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        receipt_url: invoice.hosted_invoice_url
      },
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

  if (paymentError) {
    logStep("ERROR creating payment_history", {
      error: paymentError.message,
      details: paymentError
    });
  } else {
    logStep("Payment recorded in payment_history", {
      userId: subscription.user_id,
      amount: amountInReais,
      planType: subscription.plan_type
    });
  }
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  logStep("Processing payment failed", {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription
  });

  if (!invoice.subscription) return;

  const { data: subscription } = await supabase
    .from('plan_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (!subscription) return;

  await supabase
    .from('plan_subscriptions')
    .update({
      status: 'past_due',
      payment_overdue_since: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', subscription.user_id);

  logStep("Subscription marked as past_due", { userId: subscription.user_id });
}