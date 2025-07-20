
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
    console.log(`[Main] 🚀 WEBHOOK V6.0 - ESTRUTURA CORRIGIDA [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente com privilégios de service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const payload = await req.json();
    console.log(`[Main] 📥 Payload recebido [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId,
      hasData: !!payload.data,
      hasMessage: !!payload.data?.messages
    });

    // Validação básica
    if (!payload.data?.messages || payload.data.messages.length === 0) {
      console.log(`[Main] ⚠️ Sem mensagens para processar`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma mensagem para processar'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] 🔧 Processamento V6.0 iniciado - ESTRUTURA CORRIGIDA`);

    const message = payload.data.messages[0];
    const remoteJid = message.key.remoteJid;
    const phoneAnalysis = analyzePhone(remoteJid);
    
    console.log(`[Main] 📞 Análise do telefone:`, phoneAnalysis);

    if (!phoneAnalysis.valid) {
      console.warn(`[Main] ⚠️ Telefone inválido rejeitado: ${phoneAnalysis.original}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Número de telefone inválido'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Usar a função SQL otimizada process_whatsapp_message
    console.log(`[Main] 🎯 Usando função SQL otimizada`);
    
    const messageText = getMessageText(message);
    const fromMe = message.key.fromMe || false;
    const externalId = message.key.id;
    const contactName = getContactName(message);
    
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('process_whatsapp_message', {
      p_vps_instance_id: payload.instanceId,
      p_phone: phoneAnalysis.original,
      p_message_text: messageText,
      p_from_me: fromMe,
      p_media_type: 'text',
      p_media_url: null,
      p_external_message_id: externalId,
      p_contact_name: contactName
    });

    if (rpcError) {
      console.error(`[Main] ❌ Erro na função SQL:`, rpcError);
      throw rpcError;
    }

    if (!result.success) {
      console.error(`[Main] ❌ Função SQL retornou falha:`, result);
      throw new Error(result.error || 'Função SQL falhou');
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Main] ✅ Processamento V6.0 concluído em: ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      processingTime: totalTime,
      version: 'V6.0_STRUCTURE_FIXED'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico V6.0 [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor',
      processingTime: totalTime,
      version: 'V6.0_STRUCTURE_FIXED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Funções auxiliares
function analyzePhone(remoteJid: string) {
  const original = remoteJid || '';
  const clean = original.replace(/[^0-9]/g, '');
  
  let valid = false;
  let type = 'unknown';
  
  if (clean.length >= 10 && clean.length <= 13) {
    if (clean.startsWith('55')) {
      valid = true;
      type = 'brazil';
    } else if (clean.length >= 10) {
      valid = true;
      type = 'generic';
    }
  }
  
  return { original, clean, valid, type, length: clean.length };
}

function getMessageText(message: any): string {
  if (message.message?.conversation) {
    return message.message.conversation;
  }
  
  if (message.message?.extendedTextMessage?.text) {
    return message.message.extendedTextMessage.text;
  }
  
  if (message.message?.imageMessage?.caption) {
    return message.message.imageMessage.caption;
  }
  
  return 'Mensagem sem texto';
}

function getContactName(message: any): string | null {
  if (message.pushName) {
    return message.pushName;
  }
  
  return null;
}
