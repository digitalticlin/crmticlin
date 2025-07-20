
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const startTime = Date.now();

  try {
    console.log(`[Main] 🚀 WEBHOOK SIMPLES - PROCESSAMENTO DIRETO [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const payload = await req.json();
    
    console.log(`[Main] 📥 PAYLOAD RECEBIDO [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId || payload.instanceName,
      from: payload.from,
      fromMe: payload.fromMe,
      messageType: payload.messageType
    });

    // Extrair dados básicos da mensagem
    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    const from = payload.from;
    const fromMe = payload.fromMe || false;
    const messageText = payload.message?.text || payload.data?.body || 'Mensagem sem texto';
    const messageId = payload.data?.messageId || payload.messageId;

    // Validar se temos dados mínimos
    if (!instanceId) {
      console.error(`[Main] ❌ instanceId não encontrado no payload`);
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceId não encontrado'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!from) {
      console.error(`[Main] ❌ Campo 'from' não encontrado no payload`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Campo from não encontrado'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Análise do telefone
    const phoneClean = from.replace(/[^0-9]/g, '');
    const phoneValid = phoneClean.length >= 10 && phoneClean.length <= 13;

    console.log(`[Main] 📞 Análise do telefone:`, {
      original: from,
      clean: phoneClean,
      valid: phoneValid,
      length: phoneClean.length
    });

    // Se telefone inválido, pular processamento
    if (!phoneValid) {
      console.warn(`[Main] ⚠️ Telefone inválido ignorado: ${from}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Telefone inválido - mensagem ignorada',
        phone: from
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] 💬 Processando mensagem:`, {
      text: messageText.substring(0, 50) + '...',
      fromMe,
      messageId
    });

    // Chamar função SQL para processar a mensagem
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('process_whatsapp_message', {
      p_vps_instance_id: instanceId,
      p_phone: from,
      p_message_text: messageText,
      p_from_me: fromMe,
      p_media_type: 'text',
      p_media_url: null,
      p_external_message_id: messageId,
      p_contact_name: null
    });

    if (rpcError) {
      console.error(`[Main] ❌ Erro na função SQL:`, rpcError);
      return new Response(JSON.stringify({
        success: false,
        error: rpcError.message,
        details: rpcError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!result.success) {
      console.error(`[Main] ❌ Função SQL retornou falha:`, result);
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        details: result
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ Mensagem processada com sucesso`);

    const totalTime = Date.now() - startTime;
    console.log(`[Main] ✅ Webhook processamento concluído em: ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      processing_time: totalTime,
      version: 'SIMPLE_V1'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor',
      processing_time: totalTime,
      version: 'SIMPLE_V1'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
