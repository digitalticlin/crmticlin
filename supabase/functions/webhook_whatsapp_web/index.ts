
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
    console.log(`[Main] 🚀 WEBHOOK ROBUSTO - ESTRATÉGIA DUPLA [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // FASE 1: DIAGNÓSTICO INICIAL
    console.log(`[Main] 🔍 Executando diagnóstico de permissões...`);
    const { data: diagData, error: diagError } = await supabaseAdmin.rpc('diagnose_permissions');
    
    if (diagError) {
      console.error(`[Main] ❌ Erro no diagnóstico:`, diagError);
    } else {
      console.log(`[Main] 📊 Diagnóstico:`, diagData);
    }

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

    // ESTRATÉGIA DUPLA: Tentar função completa primeiro, depois fallback
    
    // TENTATIVA 1: Função completa com leads
    console.log(`[Main] 🎯 TENTATIVA 1: Função completa (process_whatsapp_message)`);
    const { data: fullResult, error: fullError } = await supabaseAdmin.rpc('process_whatsapp_message', {
      p_vps_instance_id: instanceId,
      p_phone: from,
      p_message_text: messageText,
      p_from_me: fromMe,
      p_media_type: 'text',
      p_media_url: null,
      p_external_message_id: messageId,
      p_contact_name: null
    });

    if (!fullError && fullResult?.success) {
      console.log(`[Main] ✅ SUCESSO: Função completa processou a mensagem`);
      
      const totalTime = Date.now() - startTime;
      return new Response(JSON.stringify({
        success: true,
        data: fullResult.data,
        processing_time: totalTime,
        method: 'full_function',
        version: 'ROBUST_V1'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se chegou aqui, função completa falhou
    console.warn(`[Main] ⚠️ Função completa falhou:`, fullError || fullResult);

    // TENTATIVA 2: Função simplificada (fallback)
    console.log(`[Main] 🆘 TENTATIVA 2: Função simplificada (insert_message_only)`);
    
    // Primeiro, buscar a instância e usuário para o fallback
    const { data: instanceData, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, created_by_user_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !instanceData) {
      console.error(`[Main] ❌ Instância não encontrada para fallback:`, instanceError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Instance not found for fallback',
        original_error: fullError || fullResult,
        instance_error: instanceError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: fallbackResult, error: fallbackError } = await supabaseAdmin.rpc('insert_message_only', {
      p_instance_id: instanceData.id,
      p_phone: from,
      p_message_text: messageText,
      p_from_me: fromMe,
      p_user_id: instanceData.created_by_user_id,
      p_media_type: 'text',
      p_media_url: null,
      p_external_message_id: messageId
    });

    if (fallbackError || !fallbackResult?.success) {
      console.error(`[Main] ❌ FALHA TOTAL: Ambas as funções falharam`);
      console.error(`[Main] Função completa:`, fullError || fullResult);
      console.error(`[Main] Função fallback:`, fallbackError || fallbackResult);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Both functions failed',
        full_function_error: fullError || fullResult,
        fallback_error: fallbackError || fallbackResult,
        diagnostic: diagData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ SUCESSO: Função fallback salvou a mensagem`);
    console.warn(`[Main] ⚠️ ATENÇÃO: Mensagem salva sem lead - requer processamento posterior`);

    const totalTime = Date.now() - startTime;
    return new Response(JSON.stringify({
      success: true,
      data: fallbackResult,
      processing_time: totalTime,
      method: 'fallback_function',
      warning: 'Message saved without lead - requires post-processing',
      original_error: fullError || fullResult,
      version: 'ROBUST_V1'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro crítico interno do servidor',
      processing_time: totalTime,
      version: 'ROBUST_V1'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
