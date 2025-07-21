
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
    console.log(`[Main] 🚀 WEBHOOK SERVICE ROLE DIRETO - VERSÃO 5.0 [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente Supabase configurado com SERVICE ROLE
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      },
      db: {
        schema: 'public'
      }
    });

    // Processar payload
    const payload = await req.json();
    
    console.log(`[Main] 📥 PAYLOAD RECEBIDO [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId || payload.instanceName,
      from: payload.from,
      fromMe: payload.fromMe,
      messageType: payload.messageType
    });

    const processedMessage = PayloadProcessor.processPayload(payload);
    
    if (!processedMessage) {
      console.warn(`[Main] ⚠️ Mensagem ignorada [${requestId}]`);
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
      fromMe: processedMessage.fromMe
    });

    // Usar a nova função SERVICE ROLE otimizada
    console.log(`[Main] 📞 Chamando save_whatsapp_message_service_role [${requestId}]`);
    
    const { data: result, error } = await supabaseAdmin.rpc('save_whatsapp_message_service_role', {
      p_vps_instance_id: processedMessage.instanceId,
      p_phone: processedMessage.phone,
      p_message_text: processedMessage.messageText,
      p_from_me: processedMessage.fromMe,
      p_media_type: processedMessage.mediaType || 'text',
      p_media_url: processedMessage.mediaUrl,
      p_external_message_id: processedMessage.externalMessageId,
      p_contact_name: processedMessage.contactName
    });

    if (error) {
      console.error(`[Main] ❌ Erro na função SERVICE ROLE [${requestId}]:`, error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        details: error,
        processing_time: Date.now() - startTime,
        version: 'SERVICE_ROLE_DIRECT_V5.0'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!result || !result.success) {
      console.error(`[Main] ❌ Função retornou erro [${requestId}]:`, result);
      return new Response(JSON.stringify({
        success: false,
        error: result?.error || 'Função retornou erro desconhecido',
        details: result,
        processing_time: Date.now() - startTime,
        version: 'SERVICE_ROLE_DIRECT_V5.0'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ Sucesso total [${requestId}]:`, {
      messageId: result.data?.message_id,
      leadId: result.data?.lead_id,
      userId: result.data?.user_id,
      method: result.data?.method
    });

    // Processar mídia em background se necessário
    if (processedMessage.mediaUrl && processedMessage.mediaType !== 'text') {
      processMediaInBackground(processedMessage, result.data?.message_id);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      processing_time: Date.now() - startTime,
      version: 'SERVICE_ROLE_DIRECT_V5.0'
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
      version: 'SERVICE_ROLE_DIRECT_V5.0'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função para processar mídia em background
async function processMediaInBackground(message: ProcessedMessage, messageId: string) {
  try {
    console.log(`[Media] 📁 Processando mídia em background: ${message.mediaType} - ${messageId}`);
    
    if (!message.mediaUrl) {
      console.warn(`[Media] ⚠️ URL de mídia não encontrada para mensagem: ${messageId}`);
      return;
    }

    console.log(`[Media] 🔄 Mídia ${message.mediaType} processada para mensagem: ${messageId}`);
    console.log(`[Media] 📎 URL original: ${message.mediaUrl.substring(0, 50)}...`);
    
  } catch (error) {
    console.error(`[Media] ❌ Erro ao processar mídia para mensagem ${messageId}:`, error);
  }
}
