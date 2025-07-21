
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PayloadProcessor } from "./payloadProcessor.ts";
import { ProcessedMessage } from "./types.ts";

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
    console.log(`[Main] 🚀 WEBHOOK OTIMIZADO - VERSÃO 3.1 (FUNÇÃO SQL CORRIGIDA) [${requestId}]`);

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

    // Processar payload com validação corrigida
    const processedMessage = PayloadProcessor.processPayload(payload);
    
    if (!processedMessage) {
      console.warn(`[Main] ⚠️ Mensagem ignorada (grupo/broadcast/newsletter ou inválida) [${requestId}]`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagem ignorada',
        reason: 'rejected_by_validation',
        processing_time: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ Mensagem processada [${requestId}]:`, {
      instanceId: processedMessage.instanceId,
      phone: processedMessage.phone.substring(0, 4) + '****',
      messageType: processedMessage.messageType,
      fromMe: processedMessage.fromMe,
      hasMedia: !!processedMessage.mediaUrl,
      contactName: processedMessage.contactName
    });

    // Chamar função SQL CORRIGIDA - save_whatsapp_message_simple
    const { data: result, error } = await supabaseAdmin.rpc('save_whatsapp_message_simple', {
      p_vps_instance_id: processedMessage.instanceId,
      p_phone: processedMessage.phone,
      p_message_text: processedMessage.messageText,
      p_from_me: processedMessage.fromMe,
      p_external_message_id: processedMessage.externalMessageId
    });

    if (error) {
      console.error(`[Main] ❌ Erro na função SQL [${requestId}]:`, error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Erro na função SQL',
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!result?.success) {
      console.error(`[Main] ❌ Função SQL retornou erro [${requestId}]:`, result);
      return new Response(JSON.stringify({
        success: false,
        error: result?.error || 'Erro na função SQL',
        details: result
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ SUCESSO CORRIGIDO [${requestId}]:`, {
      messageId: result.data?.message_id,
      leadId: result.data?.lead_id,
      userId: result.data?.user_id,
      formattedPhone: result.data?.formatted_phone,
      processingTime: Date.now() - startTime
    });

    // Processar mídia em background (se existir)
    if (processedMessage.mediaUrl) {
      processMediaInBackground(processedMessage, result.data?.message_id);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      processing_time: Date.now() - startTime,
      method: 'simple_sql_function',
      version: 'WEBHOOK_OPTIMIZED_V3.1_SQL_FIXED'
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
      version: 'WEBHOOK_OPTIMIZED_V3.1_SQL_FIXED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função aprimorada para processar mídia em background
async function processMediaInBackground(message: ProcessedMessage, messageId: string) {
  try {
    console.log(`[Media] 📁 Processando mídia em background: ${message.mediaType} - ${messageId}`);
    
    if (!message.mediaUrl) {
      console.warn(`[Media] ⚠️ URL de mídia não encontrada para mensagem: ${messageId}`);
      return;
    }

    // TODO: Implementar download e upload para Supabase Storage
    // 1. Baixar mídia da URL original
    // 2. Validar formato e tamanho
    // 3. Upload para bucket whatsapp-media
    // 4. Atualizar mensagem com nova URL
    
    console.log(`[Media] 🔄 Mídia ${message.mediaType} processada para mensagem: ${messageId}`);
    console.log(`[Media] 📎 URL original: ${message.mediaUrl.substring(0, 50)}...`);
    
  } catch (error) {
    console.error(`[Media] ❌ Erro ao processar mídia para mensagem ${messageId}:`, error);
  }
}
