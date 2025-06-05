
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processMultiTenantMessage } from '../whatsapp_web_server/globalWebhookConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Webhook Multi-Tenant] 🌐 WEBHOOK GLOBAL RECEBIDO');
  console.log('[Webhook Multi-Tenant] Method:', req.method);
  console.log('[Webhook Multi-Tenant] Headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    const webhookData = await req.json();
    console.log('[Webhook Multi-Tenant] 📋 Payload recebido:', JSON.stringify(webhookData, null, 2));

    // Extrair dados da mensagem
    const { 
      instanceName,
      data: messageData,
      event,
      server_url 
    } = webhookData;

    if (!instanceName) {
      console.log('[Webhook Multi-Tenant] ⚠️ instanceName não fornecido');
      return new Response('instanceName é obrigatório', { status: 400 });
    }

    console.log('[Webhook Multi-Tenant] 🏢 Processando para instância:', instanceName);
    console.log('[Webhook Multi-Tenant] 📡 Evento:', event);

    // NOVO: Processar mensagem usando o sistema multi-tenant
    const result = await processMultiTenantMessage(supabase, {
      instanceName,
      data: messageData,
      event,
      server_url
    });

    if (!result.success) {
      console.error('[Webhook Multi-Tenant] ❌ Erro no processamento:', result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          instanceName,
          event 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[Webhook Multi-Tenant] ✅ Mensagem processada com sucesso:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: true,
        instanceName,
        event,
        result: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook Multi-Tenant] 💥 Erro no webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
