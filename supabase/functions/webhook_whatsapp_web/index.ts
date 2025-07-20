
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
    console.log(`[Main] 🚀 WEBHOOK V7.1 - ENHANCED PAYLOAD PROCESSOR [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const payload = await req.json();
    
    console.log(`[Main] 📋 PAYLOAD ESTRUTURA COMPLETA [${requestId}]:`, {
      keys: Object.keys(payload),
      event: payload.event,
      instanceId: payload.instanceId || payload.instanceName,
      hasData: !!payload.data,
      dataType: payload.data ? typeof payload.data : 'none',
      dataKeys: payload.data ? Object.keys(payload.data) : [],
      hasMessages: !!payload.messages,
      messagesType: payload.messages ? typeof payload.messages : 'none'
    });

    console.log(`[Main] 📥 PAYLOAD RAW [${requestId}]:`, JSON.stringify(payload, null, 2));

    // ESTRATÉGIAS AVANÇADAS DE EXTRAÇÃO DE MENSAGENS
    let messages = null;
    let extractionMethod = '';

    // Estratégia 1: payload.messages direto
    if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
      messages = payload.messages;
      extractionMethod = 'direct_messages';
      console.log(`[Main] ✅ Estratégia 1 - Mensagens via payload.messages: ${messages.length}`);
    }
    
    // Estratégia 2: payload.data.messages
    else if (payload.data?.messages && Array.isArray(payload.data.messages) && payload.data.messages.length > 0) {
      messages = payload.data.messages;
      extractionMethod = 'data_messages';
      console.log(`[Main] ✅ Estratégia 2 - Mensagens via payload.data.messages: ${messages.length}`);
    }
    
    // Estratégia 3: payload.data como array de mensagens
    else if (Array.isArray(payload.data) && payload.data.length > 0) {
      // Verificar se o primeiro item parece uma mensagem
      const firstItem = payload.data[0];
      if (firstItem && (firstItem.key || firstItem.message || firstItem.text)) {
        messages = payload.data;
        extractionMethod = 'data_array';
        console.log(`[Main] ✅ Estratégia 3 - Mensagens via payload.data array: ${messages.length}`);
      }
    }
    
    // Estratégia 4: Buscar em propriedades que contenham 'message'
    if (!messages) {
      console.log(`[Main] 🔍 Estratégia 4 - Busca por propriedades com 'message'`);
      
      for (const [key, value] of Object.entries(payload)) {
        if (key.toLowerCase().includes('message') && Array.isArray(value) && value.length > 0) {
          messages = value;
          extractionMethod = `property_${key}`;
          console.log(`[Main] ✅ Mensagens encontradas via payload.${key}: ${messages.length}`);
          break;
        }
      }
      
      // Buscar dentro de payload.data
      if (!messages && payload.data && typeof payload.data === 'object') {
        for (const [key, value] of Object.entries(payload.data)) {
          if (key.toLowerCase().includes('message') && Array.isArray(value) && value.length > 0) {
            messages = value;
            extractionMethod = `data_property_${key}`;
            console.log(`[Main] ✅ Mensagens encontradas via payload.data.${key}: ${messages.length}`);
            break;
          }
        }
      }
    }

    // Estratégia 5: Busca recursiva por estruturas de mensagem
    if (!messages) {
      console.log(`[Main] 🔍 Estratégia 5 - Busca recursiva por estruturas de mensagem`);
      
      function findMessagesRecursive(obj: any, path = ''): any {
        if (Array.isArray(obj)) {
          // Verificar se é array de mensagens
          if (obj.length > 0) {
            const firstItem = obj[0];
            if (firstItem && typeof firstItem === 'object') {
              // Verificar se tem propriedades típicas de mensagem WhatsApp
              if (firstItem.key || firstItem.message || firstItem.text || firstItem.body) {
                return { messages: obj, path };
              }
            }
          }
        } else if (obj && typeof obj === 'object') {
          for (const [key, value] of Object.entries(obj)) {
            const result = findMessagesRecursive(value, path ? `${path}.${key}` : key);
            if (result) return result;
          }
        }
        return null;
      }

      const found = findMessagesRecursive(payload);
      if (found) {
        messages = found.messages;
        extractionMethod = `recursive_${found.path}`;
        console.log(`[Main] ✅ Mensagens encontradas via busca recursiva em ${found.path}: ${messages.length}`);
      }
    }

    // Estratégia 6: Tentar extrair mensagem única do payload
    if (!messages && payload.event === 'message_received') {
      console.log(`[Main] 🔍 Estratégia 6 - Tentativa de extrair mensagem única`);
      
      // Verificar se o próprio payload é uma mensagem
      if (payload.key || payload.message || payload.text) {
        messages = [payload];
        extractionMethod = 'single_message_payload';
        console.log(`[Main] ✅ Mensagem única extraída do payload raiz`);
      }
      // Verificar se payload.data é uma mensagem única
      else if (payload.data && (payload.data.key || payload.data.message || payload.data.text)) {
        messages = [payload.data];
        extractionMethod = 'single_message_data';
        console.log(`[Main] ✅ Mensagem única extraída de payload.data`);
      }
    }

    // DIAGNÓSTICO FINAL
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log(`[Main] ⚠️ NENHUMA MENSAGEM ENCONTRADA - DIAGNÓSTICO COMPLETO [${requestId}]`);
      console.log(`[Main] 📊 Análise do payload:`, {
        event: payload.event,
        instanceId: payload.instanceId || payload.instanceName,
        topLevelKeys: Object.keys(payload),
        dataExists: !!payload.data,
        dataType: payload.data ? typeof payload.data : 'none',
        dataKeys: payload.data && typeof payload.data === 'object' ? Object.keys(payload.data) : [],
        hasArrays: Object.values(payload).some(v => Array.isArray(v)),
        hasNestedArrays: payload.data && typeof payload.data === 'object' ? 
          Object.values(payload.data).some(v => Array.isArray(v)) : false,
        extractionStrategiesUsed: [
          'direct_messages',
          'data_messages', 
          'data_array',
          'property_search',
          'recursive_search',
          'single_message'
        ]
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma mensagem para processar',
        extraction_method: 'none',
        debug: {
          payload_structure: {
            keys: Object.keys(payload),
            event: payload.event,
            instanceId: payload.instanceId || payload.instanceName,
            data_type: payload.data ? typeof payload.data : 'none'
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] 🎯 PROCESSANDO ${messages.length} MENSAGEM(S) via ${extractionMethod} [${requestId}]`);

    // Obter instanceId
    const instanceId = payload.instanceId || payload.instanceName || payload.instance;
    if (!instanceId) {
      throw new Error('instanceId não encontrado no payload');
    }

    // Processar cada mensagem
    const results = [];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`[Main] 📝 Processando mensagem ${i + 1}/${messages.length}:`, {
        hasKey: !!message.key,
        hasMessage: !!message.message,
        hasText: !!message.text,
        hasBody: !!message.body,
        keyDetails: message.key ? {
          id: message.key.id,
          remoteJid: message.key.remoteJid,
          fromMe: message.key.fromMe
        } : null,
        messageType: message.message ? Object.keys(message.message)[0] : 'unknown'
      });

      // Extrair dados da mensagem
      const remoteJid = message.key?.remoteJid || message.from || message.phone;
      const phoneAnalysis = analyzePhone(remoteJid);
      
      console.log(`[Main] 📞 Análise do telefone:`, phoneAnalysis);

      if (!phoneAnalysis.valid) {
        console.warn(`[Main] ⚠️ Telefone inválido ignorado: ${phoneAnalysis.original}`);
        continue;
      }

      const messageText = getMessageText(message);
      const fromMe = message.key?.fromMe || message.fromMe || false;
      const externalId = message.key?.id || message.id || message.messageId;
      const contactName = getContactName(message);
      
      console.log(`[Main] 💬 Detalhes da mensagem:`, {
        text: messageText?.substring(0, 50) + '...',
        fromMe,
        externalId,
        contactName
      });

      // Chamar função SQL para processar
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
    console.log(`[Main] ✅ Webhook V7.1 processamento concluído em: ${totalTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
      extraction_method: extractionMethod,
      processing_time: totalTime,
      version: 'V7.1_ENHANCED_PAYLOAD_PROCESSOR'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico V7.1 [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor',
      processing_time: totalTime,
      version: 'V7.1_ENHANCED_PAYLOAD_PROCESSOR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Funções auxiliares aprimoradas
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
  // Estratégias múltiplas para extrair texto
  if (message.message?.conversation) {
    return message.message.conversation;
  }
  
  if (message.message?.extendedTextMessage?.text) {
    return message.message.extendedTextMessage.text;
  }
  
  if (message.message?.imageMessage?.caption) {
    return message.message.imageMessage.caption;
  }
  
  if (message.text) {
    return message.text;
  }
  
  if (message.body) {
    return message.body;
  }
  
  if (message.content) {
    return message.content;
  }
  
  return 'Mensagem sem texto';
}

function getContactName(message: any): string | null {
  if (message.pushName) {
    return message.pushName;
  }
  
  if (message.notifyName) {
    return message.notifyName;
  }
  
  if (message.contact?.name) {
    return message.contact.name;
  }
  
  return null;
}
