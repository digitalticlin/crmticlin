
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
    console.log(`[Main] 🚀 WEBHOOK SIMPLIFICADO - VERSÃO ROBUSTA [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parsear payload
    const payload = await req.json();
    
    console.log(`[Main] 📥 PAYLOAD RECEBIDO [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId || payload.instanceName,
      from: payload.from,
      fromMe: payload.fromMe,
      messageType: payload.messageType
    });

    // Extrair dados essenciais
    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    const from = payload.from;
    const fromMe = payload.fromMe || false;
    const messageText = payload.message?.text || payload.data?.body || payload.text || 'Mensagem sem texto';
    const messageId = payload.data?.messageId || payload.messageId;

    // VALIDAÇÃO BÁSICA
    if (!instanceId) {
      console.error(`[Main] ❌ instanceId não encontrado no payload`);
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceId não encontrado'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!from) {
      console.error(`[Main] ❌ Campo 'from' não encontrado no payload`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Campo from não encontrado'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // VALIDAÇÃO DO TELEFONE
    const phoneClean = from.replace(/[^0-9]/g, '');
    const phoneValid = phoneClean.length >= 10 && phoneClean.length <= 13;

    console.log(`[Main] 📞 Análise do telefone:`, {
      original: from,
      clean: phoneClean,
      valid: phoneValid,
      length: phoneClean.length
    });

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

    // VALIDAÇÃO DA MENSAGEM
    if (!messageText || messageText.trim().length === 0) {
      console.warn(`[Main] ⚠️ Mensagem vazia ignorada`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagem vazia - ignorada',
        phone: from
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] 💬 Processando mensagem:`, {
      text: messageText.substring(0, 50) + '...',
      fromMe,
      messageId,
      instanceId
    });

    // CHAMAR FUNÇÃO SQL SIMPLIFICADA
    console.log(`[Main] 🎯 Chamando função SQL simplificada: save_whatsapp_message_simple`);
    
    const { data: result, error } = await supabaseAdmin.rpc('save_whatsapp_message_simple', {
      p_vps_instance_id: instanceId,
      p_phone: from,
      p_message_text: messageText,
      p_from_me: fromMe,
      p_external_message_id: messageId
    });

    if (error) {
      console.error(`[Main] ❌ Erro na função SQL:`, error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Erro na função SQL',
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!result) {
      console.error(`[Main] ❌ Resultado vazio da função SQL`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Resultado vazio da função SQL'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!result.success) {
      console.error(`[Main] ❌ Função SQL retornou erro:`, result);
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Erro na função SQL',
        details: result
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ SUCESSO: Mensagem processada com sucesso:`, {
      messageId: result.data?.message_id,
      leadId: result.data?.lead_id,
      instanceId: result.data?.instance_id,
      userId: result.data?.user_id,
      phone: result.data?.formatted_phone,
      fromMe: result.data?.from_me
    });

    const totalTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      processing_time: totalTime,
      method: 'simplified_sql_function',
      version: 'ROBUST_SIMPLE_V1'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro crítico interno do servidor',
      processing_time: totalTime,
      version: 'ROBUST_SIMPLE_V1'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
