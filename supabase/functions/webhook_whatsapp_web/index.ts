
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
    console.log(`[Main] 🚀 WEBHOOK V7.0 - PAYLOAD PROCESSOR [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente com privilégios de service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const payload = await req.json();
    
    // LOG COMPLETO DO PAYLOAD PARA DIAGNÓSTICO
    console.log(`[Main] 📋 PAYLOAD COMPLETO [${requestId}]:`, JSON.stringify(payload, null, 2));
    
    console.log(`[Main] 📥 Resumo do Payload [${requestId}]:`, {
      event: payload.event,
      instanceId: payload.instanceId || payload.instanceName,
      hasData: !!payload.data,
      dataKeys: payload.data ? Object.keys(payload.data) : [],
      hasMessages: !!payload.messages,
      hasDataMessages: !!(payload.data?.messages),
      payloadKeys: Object.keys(payload)
    });

    // MÚLTIPLAS ESTRATÉGIAS DE EXTRAÇÃO DE MENSAGENS
    let messages = null;
    let extractionMethod = '';

    // Estratégia 1: payload.messages direto
    if (payload.messages && Array.isArray(payload.messages)) {
      messages = payload.messages;
      extractionMethod = 'direct_messages';
      console.log(`[Main] ✅ Mensagens encontradas via payload.messages (${messages.length} mensagens)`);
    }
    
    // Estratégia 2: payload.data.messages
    else if (payload.data?.messages && Array.isArray(payload.data.messages)) {
      messages = payload.data.messages;
      extractionMethod = 'data_messages';
      console.log(`[Main] ✅ Mensagens encontradas via payload.data.messages (${messages.length} mensagens)`);
    }
    
    // Estratégia 3: payload.data como array de mensagens
    else if (payload.data && Array.isArray(payload.data)) {
      messages = payload.data;
      extractionMethod = 'data_array';
      console.log(`[Main] ✅ Mensagens encontradas via payload.data como array (${messages.length} mensagens)`);
    }
    
    // Estratégia 4: Buscar em qualquer propriedade que contenha 'message'
    else {
      for (const [key, value] of Object.entries(payload)) {
        if (key.toLowerCase().includes('message') && Array.isArray(value) && value.length > 0) {
          messages = value;
          extractionMethod = `property_${key}`;
          console.log(`[Main] ✅ Mensagens encontradas via payload.${key} (${messages.length} mensagens)`);
          break;
        }
      }
      
      // Buscar dentro de payload.data
      if (!messages && payload.data) {
        for (const [key, value] of Object.entries(payload.data)) {
          if (key.toLowerCase().includes('message') && Array.isArray(value) && value.length > 0) {
            messages = value;
            extractionMethod = `data_${key}`;
            console.log(`[Main] ✅ Mensagens encontradas via payload.data.${key} (${messages.length} mensagens)`);
            break;
          }
        }
      }
    }

    // Se ainda não encontrou mensagens, tentar extrair de estruturas aninhadas
    if (!messages) {
      console.log(`[Main] 🔍 Procurando mensagens em estruturas aninhadas...`);
      
      // Função recursiva para buscar mensagens
      function findMessages(obj: any, path = ''): any {
        if (Array.isArray(obj)) {
          // Se é um array, verificar se contém objetos que parecem mensagens
          if (obj.length > 0 && obj[0] && typeof obj[0] === 'object') {
            // Verificar se tem propriedades típicas de mensagem
            const firstItem = obj[0];
            if (firstItem.key || firstItem.message || firstItem.text || firstItem.content) {
              return { messages: obj, path };
            }
          }
        } else if (obj && typeof obj === 'object') {
          for (const [key, value] of Object.entries(obj)) {
            const result = findMessages(value, path ? `${path}.${key}` : key);
            if (result) return result;
          }
        }
        return null;
      }

      const found = findMessages(payload);
      if (found) {
        messages = found.messages;
        extractionMethod = `nested_${found.path}`;
        console.log(`[Main] ✅ Mensagens encontradas via busca aninhada em ${found.path} (${messages.length} mensagens)`);
      }
    }

    // Verificar se encontrou mensagens válidas
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log(`[Main] ⚠️ Nenhuma mensagem encontrada no payload`);
      console.log(`[Main] 📊 Estrutura do payload analisada:`, {
        topLevelKeys: Object.keys(payload),
        dataKeys: payload.data ? Object.keys(payload.data) : null,
        hasArrays: Object.values(payload).some(v => Array.isArray(v)),
        hasDataArrays: payload.data ? Object.values(payload.data).some(v => Array.isArray(v)) : false
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma mensagem para processar',
        debug: {
          extractionAttempts: ['direct_messages', 'data_messages', 'data_array', 'nested_search'],
          payloadStructure: {
            keys: Object.keys(payload),
            dataKeys: payload.data ? Object.keys(payload.data) : null
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] 🎯 Processando ${messages.length} mensagem(s) via ${extractionMethod}`);

    // Obter instanceId
    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    if (!instanceId) {
      throw new Error('instanceId não encontrado no payload');
    }

    // Processar cada mensagem
    const results = [];
    for (const message of messages) {
      console.log(`[Main] 📝 Processando mensagem:`, {
        hasKey: !!message.key,
        hasMessage: !!message.message,
        keyDetails: message.key ? {
          id: message.key.id,
          remoteJid: message.key.remoteJid,
          fromMe: message.key.fromMe
        } : null,
        messageType: message.message ? Object.keys(message.message)[0] : null
      });

      const remoteJid = message.key?.remoteJid;
      const phoneAnalysis = analyzePhone(remoteJid);
      
      console.log(`[Main] 📞 Análise do telefone:`, phoneAnalysis);

      if (!phoneAnalysis.valid) {
        console.warn(`[Main] ⚠️ Telefone inválido: ${phoneAnalysis.original}`);
        continue;
      }

      const messageText = getMessageText(message);
      const fromMe = message.key?.fromMe || false;
      const externalId = message.key?.id;
      const contactName = getContactName(message);
      
      console.log(`[Main] 💬 Detalhes da mensagem:`, {
        text: messageText?.substring(0, 50) + '...',
        fromMe,
        externalId,
        contactName
      });

      // Usar a função SQL process_whatsapp_message
      const { data: result, error: rpcError } = await supabaseAdmin.rpc('process_whatsapp_message', {
        p_vps_instance_id: instanceId,
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
        results.push({ success: false, error: rpcError.message });
      } else if (!result.success) {
        console.error(`[Main] ❌ Função SQL retornou falha:`, result);
        results.push({ success: false, error: result.error });
      } else {
        console.log(`[Main] ✅ Mensagem processada com sucesso`);
        results.push({ success: true, data: result.data });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Main] ✅ Processamento V7.0 concluído em: ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
      extractionMethod,
      processingTime: totalTime,
      version: 'V7.0_PAYLOAD_PROCESSOR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico V7.0 [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor',
      processingTime: totalTime,
      version: 'V7.0_PAYLOAD_PROCESSOR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Funções auxiliares mantidas
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
