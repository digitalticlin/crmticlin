import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-REMINDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Billing reminder job started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar usuários para enviar cobrança
    const { data: overdueUsers, error } = await supabase
      .from('plan_subscriptions')
      .select(`
        *,
        profiles!inner(whatsapp, full_name),
        whatsapp_instances!inner(id, instance_name)
      `)
      .eq('status', 'active')
      .not('payment_overdue_since', 'is', null);

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    logStep("Found overdue users", { count: overdueUsers?.length || 0 });

    for (const user of overdueUsers || []) {
      const daysOverdue = getDaysOverdue(user.payment_overdue_since);

      logStep("Processing user", {
        userId: user.user_id,
        fullName: user.profiles.full_name,
        daysOverdue: daysOverdue
      });

      // Verificar se já enviou lembrete hoje
      const { data: todayReminder } = await supabase
        .from('billing_reminders')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('reminder_type', `DAY_${daysOverdue}`)
        .gte('sent_at', new Date().toISOString().split('T')[0])
        .single();

      if (todayReminder) {
        logStep("Reminder already sent today", { userId: user.user_id });
        continue;
      }

      let message = '';
      let shouldBlock = false;

      switch (daysOverdue) {
        case 0:
          message = `Olá ${user.profiles.full_name}! 👋\n\n` +
                   `Seu plano vence hoje.\n` +
                   `Valor: R$ ${getPlanPrice(user.plan_type)}\n\n` +
                   `💳 *Pague agora e evite bloqueios:*\n` +
                   `${getPaymentLink()}\n\n` +
                   `Em caso de dúvidas, responda esta mensagem.`;
          break;

        case 1:
          message = `⚠️ *ATENÇÃO* - Pagamento em atraso\n\n` +
                   `${user.profiles.full_name}, seu plano está em atraso há 1 dia.\n` +
                   `Em 2 dias seu acesso será bloqueado.\n\n` +
                   `🔗 Regularize agora:\n${getPaymentLink()}\n\n` +
                   `💬 Precisa de ajuda? Responda esta mensagem.`;
          break;

        case 2:
          message = `🚨 *ÚLTIMO AVISO*\n\n` +
                   `Amanhã seu acesso ao CRM será BLOQUEADO!\n\n` +
                   `⏰ Regularize AGORA para não perder acesso:\n` +
                   `${getPaymentLink()}\n\n` +
                   `📞 Urgente? Entre em contato conosco.`;
          break;

        case 3:
          message = `🔒 *ACESSO BLOQUEADO*\n\n` +
                   `Seu acesso ao CRM foi bloqueado por falta de pagamento.\n\n` +
                   `Para liberar imediatamente, pague agora:\n` +
                   `${getPaymentLink()}\n\n` +
                   `Após pagamento, acesso liberado automaticamente.`;
          shouldBlock = true;
          break;

        default:
          if (daysOverdue > 3) {
            message = `🔒 *ACESSO BLOQUEADO - ${daysOverdue} DIAS*\n\n` +
                     `Seu acesso continua bloqueado.\n\n` +
                     `Regularize seu pagamento:\n${getPaymentLink()}\n\n` +
                     `Precisa de ajuda? Responda esta mensagem.`;
          }
      }

      if (message) {
        // Enviar via WhatsApp
        const sent = await sendWhatsAppReminder(
          user.whatsapp_instances.id,
          user.profiles.whatsapp,
          message,
          user.user_id
        );

        if (sent) {
          // Registrar lembrete enviado
          await supabase
            .from('billing_reminders')
            .insert({
              user_id: user.user_id,
              reminder_type: `DAY_${daysOverdue}`,
              message_sent: message,
              sent_via: 'whatsapp'
            });

          logStep("Reminder sent", {
            userId: user.user_id,
            daysOverdue: daysOverdue
          });
        }

        // Bloquear acesso se necessário
        if (shouldBlock) {
          await supabase
            .from('plan_subscriptions')
            .update({
              platform_blocked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.user_id);

          logStep("User access blocked", { userId: user.user_id });
        }
      }

      // Aguardar 1 segundo entre envios para evitar spam
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logStep("Billing reminder job completed");

    return new Response(JSON.stringify({
      success: true,
      processed: overdueUsers?.length || 0
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

function getDaysOverdue(overdueDate: string): number {
  const overdue = new Date(overdueDate);
  const now = new Date();
  const diffTime = now.getTime() - overdue.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getPlanPrice(planType: string): string {
  switch (planType) {
    case 'pro_5k': return '399,00';
    case 'ultra_15k': return '799,00';
    default: return '0,00';
  }
}

function getPaymentLink(): string {
  const baseUrl = Deno.env.get("FRONTEND_URL") || "https://seu-crm.com";
  return `${baseUrl}/plans`;
}

async function sendWhatsAppReminder(
  instanceId: string,
  phone: string,
  message: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai_messaging_service`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceId: instanceId,
          leadId: userId, // Usar userId como leadId para cobrança
          phone: phone,
          message: message,
          mediaType: 'text',
          createdByUserId: 'system', // Sistema enviando
          apiKey: Deno.env.get("AI_AGENT_API_KEY"),
          skipUsageCount: true, // Não contar no limite
          messageType: 'billing_reminder'
        })
      }
    );

    const result = await response.json();

    if (result.success) {
      logStep("WhatsApp reminder sent", {
        phone: phone.substring(0, 4) + '****',
        instanceId: instanceId
      });
      return true;
    } else {
      logStep("Failed to send WhatsApp reminder", {
        error: result.error,
        phone: phone.substring(0, 4) + '****'
      });
      return false;
    }

  } catch (error) {
    logStep("Error sending WhatsApp reminder", {
      error: error.message,
      phone: phone.substring(0, 4) + '****'
    });
    return false;
  }
}