import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MERCADOPAGO-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const mercadoPagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadoPagoAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Obter dados do webhook
    const webhookData = await req.json();
    logStep("Webhook data received", webhookData);

    // Mercado Pago envia diferentes tipos de notificação
    if (webhookData.type === "payment") {
      const paymentId = webhookData.data?.id;

      if (!paymentId) {
        logStep("No payment ID in webhook");
        return new Response("OK", { status: 200 });
      }

      // Buscar detalhes do pagamento na API do Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${mercadoPagoAccessToken}`
        }
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment details: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      logStep("Payment details fetched", {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference
      });

      const userId = payment.external_reference;
      if (!userId) {
        logStep("No user ID in payment external_reference");
        return new Response("OK", { status: 200 });
      }

      // Processar baseado no status do pagamento
      switch (payment.status) {
        case "approved":
          await handlePaymentApproved(supabase, payment, userId);
          break;
        case "rejected":
        case "cancelled":
          await handlePaymentFailed(supabase, payment, userId);
          break;
        case "pending":
        case "in_process":
          await handlePaymentPending(supabase, payment, userId);
          break;
        default:
          logStep("Unknown payment status", { status: payment.status });
      }

    } else {
      logStep("Non-payment webhook type", { type: webhookData.type });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

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

async function handlePaymentApproved(supabase: any, payment: any, userId: string) {
  logStep("Processing approved payment", {
    paymentId: payment.id,
    userId: userId,
    amount: payment.transaction_amount
  });

  try {
    // Determinar tipo de plano baseado no valor
    const amount = payment.transaction_amount;
    let planType = 'free_200';

    if (amount >= 799) {
      planType = 'ultra_15k';
    } else if (amount >= 399) {
      planType = 'pro_5k';
    }

    // Processar pagamento aprovado usando RPC
    const { data: result, error } = await supabase.rpc('process_payment_approved', {
      p_user_id: userId,
      p_payment_id: payment.id.toString(),
      p_plan_type: planType,
      p_amount: amount
    });

    if (error) {
      throw new Error(`RPC error: ${error.message}`);
    }

    logStep("Payment processed successfully", {
      userId: userId,
      planType: planType,
      messageLimit: result?.message_limit,
      memberLimit: result?.member_limit
    });

    // Enviar notificação de sucesso via WhatsApp (opcional)
    await sendWhatsAppNotification(userId, 'PAYMENT_SUCCESS', {
      plan_type: planType,
      amount: amount
    });

  } catch (error) {
    logStep("Error processing approved payment", {
      error: error.message,
      paymentId: payment.id,
      userId: userId
    });
    throw error;
  }
}

async function handlePaymentFailed(supabase: any, payment: any, userId: string) {
  logStep("Processing failed payment", {
    paymentId: payment.id,
    userId: userId,
    status: payment.status
  });

  // Registrar pagamento falhado no histórico
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      payment_id: payment.id.toString(),
      status: payment.status,
      amount: payment.transaction_amount || 0,
      gateway: 'mercadopago',
      gateway_response: payment
    });

  // Enviar notificação de falha via WhatsApp (opcional)
  await sendWhatsAppNotification(userId, 'PAYMENT_FAILED', {
    status: payment.status,
    status_detail: payment.status_detail
  });
}

async function handlePaymentPending(supabase: any, payment: any, userId: string) {
  logStep("Processing pending payment", {
    paymentId: payment.id,
    userId: userId,
    paymentMethod: payment.payment_method_id
  });

  // Registrar pagamento pendente no histórico
  await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      payment_id: payment.id.toString(),
      status: 'pending',
      amount: payment.transaction_amount || 0,
      payment_method: payment.payment_method_id,
      gateway: 'mercadopago',
      gateway_response: payment
    });

  // Enviar notificação de pendência via WhatsApp (opcional)
  await sendWhatsAppNotification(userId, 'PAYMENT_PENDING', {
    payment_method: payment.payment_method_id,
    payment_id: payment.id
  });
}

async function sendWhatsAppNotification(userId: string, type: string, data: any) {
  try {
    // Implementar envio via edge ai_messaging_service
    // Por ora, apenas log
    logStep("WhatsApp notification", {
      userId: userId,
      type: type,
      data: data
    });
  } catch (error) {
    logStep("Error sending WhatsApp notification", {
      error: error.message,
      userId: userId,
      type: type
    });
  }
}