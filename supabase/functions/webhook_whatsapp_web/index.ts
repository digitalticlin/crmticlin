
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
    console.log(`[Main] 🚀 WEBHOOK TESTE 3 OPÇÕES - VERSÃO 4.0 [${requestId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // OPÇÃO 3: Cliente com SERVICE ROLE configurado corretamente
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

    // TESTE DAS 3 OPÇÕES EM PARALELO
    const testResults = await Promise.allSettled([
      testOption1(supabaseAdmin, processedMessage, requestId),
      testOption2(supabaseAdmin, processedMessage, requestId),
      testOption3(supabaseAdmin, processedMessage, requestId)
    ]);

    console.log(`[Main] 🧪 RESULTADOS DOS TESTES [${requestId}]:`);
    testResults.forEach((result, index) => {
      const optionName = ['OPÇÃO 1 (save_whatsapp_message_simple)', 'OPÇÃO 2 (insert_message_optimized)', 'OPÇÃO 3 (service_role_config)'][index];
      if (result.status === 'fulfilled') {
        console.log(`[Main] ✅ ${optionName}: SUCESSO -`, result.value);
      } else {
        console.log(`[Main] ❌ ${optionName}: FALHOU -`, result.reason);
      }
    });

    // Usar a primeira opção que funcionou
    const successfulOption = testResults.find(result => result.status === 'fulfilled');
    
    if (successfulOption) {
      console.log(`[Main] 🎯 USANDO OPÇÃO QUE FUNCIONOU [${requestId}]`);
      return new Response(JSON.stringify({
        success: true,
        data: successfulOption.value,
        processing_time: Date.now() - startTime,
        version: 'WEBHOOK_3_OPTIONS_TEST_V4.0'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.error(`[Main] ❌ TODAS AS OPÇÕES FALHARAM [${requestId}]`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Todas as opções testadas falharam',
        test_results: testResults.map((result, index) => ({
          option: index + 1,
          status: result.status,
          error: result.status === 'rejected' ? result.reason : null
        })),
        processing_time: Date.now() - startTime
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`[Main] ❌ Erro crítico [${requestId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro crítico interno do servidor',
      processing_time: totalTime,
      version: 'WEBHOOK_3_OPTIONS_TEST_V4.0'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// OPÇÃO 1: Função save_whatsapp_message_simple original
async function testOption1(supabaseAdmin: any, message: ProcessedMessage, requestId: string) {
  console.log(`[OPÇÃO 1] 🧪 Testando save_whatsapp_message_simple [${requestId}]`);
  
  const { data: result, error } = await supabaseAdmin.rpc('save_whatsapp_message_simple', {
    p_vps_instance_id: message.instanceId,
    p_phone: message.phone,
    p_message_text: message.messageText,
    p_from_me: message.fromMe,
    p_external_message_id: message.externalMessageId
  });

  if (error) {
    console.error(`[OPÇÃO 1] ❌ Erro [${requestId}]:`, error);
    throw new Error(`OPÇÃO 1 FALHOU: ${error.message}`);
  }

  console.log(`[OPÇÃO 1] ✅ Sucesso [${requestId}]:`, result);
  return { ...result, method: 'save_whatsapp_message_simple' };
}

// OPÇÃO 2: Função insert_message_optimized com busca manual do usuário
async function testOption2(supabaseAdmin: any, message: ProcessedMessage, requestId: string) {
  console.log(`[OPÇÃO 2] 🧪 Testando insert_message_optimized [${requestId}]`);
  
  // Primeiro, buscar instância e usuário
  const { data: instance, error: instanceError } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('id, created_by_user_id')
    .eq('vps_instance_id', message.instanceId)
    .single();

  if (instanceError || !instance) {
    console.error(`[OPÇÃO 2] ❌ Instância não encontrada [${requestId}]:`, instanceError);
    throw new Error(`OPÇÃO 2 FALHOU: Instância não encontrada`);
  }

  console.log(`[OPÇÃO 2] ✅ Instância encontrada [${requestId}]:`, instance.id);

  // Buscar ou criar lead
  const formattedPhone = formatPhoneBrazilian(message.phone);
  
  let { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('phone', formattedPhone)
    .eq('created_by_user_id', instance.created_by_user_id)
    .single();

  if (leadError && leadError.code === 'PGRST116') {
    // Lead não existe, criar novo
    const { data: newLead, error: createLeadError } = await supabaseAdmin
      .from('leads')
      .insert({
        phone: formattedPhone,
        name: `Contato ${formattedPhone}`,
        whatsapp_number_id: instance.id,
        created_by_user_id: instance.created_by_user_id,
        last_message_time: new Date().toISOString(),
        last_message: message.messageText,
        import_source: 'realtime'
      })
      .select('id')
      .single();

    if (createLeadError) {
      console.error(`[OPÇÃO 2] ❌ Erro ao criar lead [${requestId}]:`, createLeadError);
      throw new Error(`OPÇÃO 2 FALHOU: Erro ao criar lead`);
    }

    lead = newLead;
    console.log(`[OPÇÃO 2] ✅ Lead criado [${requestId}]:`, lead.id);
  } else if (leadError) {
    console.error(`[OPÇÃO 2] ❌ Erro ao buscar lead [${requestId}]:`, leadError);
    throw new Error(`OPÇÃO 2 FALHOU: Erro ao buscar lead`);
  } else {
    console.log(`[OPÇÃO 2] ✅ Lead encontrado [${requestId}]:`, lead.id);
  }

  // Usar insert_message_optimized
  const { data: result, error } = await supabaseAdmin.rpc('insert_message_optimized', {
    p_lead_id: lead.id,
    p_instance_id: instance.id,
    p_message_text: message.messageText,
    p_from_me: message.fromMe,
    p_user_id: instance.created_by_user_id,
    p_media_type: message.mediaType || 'text',
    p_media_url: message.mediaUrl,
    p_external_message_id: message.externalMessageId
  });

  if (error) {
    console.error(`[OPÇÃO 2] ❌ Erro [${requestId}]:`, error);
    throw new Error(`OPÇÃO 2 FALHOU: ${error.message}`);
  }

  console.log(`[OPÇÃO 2] ✅ Sucesso [${requestId}]:`, result);
  return { ...result, method: 'insert_message_optimized', lead_id: lead.id };
}

// OPÇÃO 3: Verificar se configuração do SERVICE ROLE está funcionando
async function testOption3(supabaseAdmin: any, message: ProcessedMessage, requestId: string) {
  console.log(`[OPÇÃO 3] 🧪 Testando configuração SERVICE ROLE [${requestId}]`);
  
  // Testar acesso direto às tabelas
  const { data: instanceTest, error: instanceError } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('id, created_by_user_id')
    .eq('vps_instance_id', message.instanceId)
    .single();

  if (instanceError) {
    console.error(`[OPÇÃO 3] ❌ Erro acesso whatsapp_instances [${requestId}]:`, instanceError);
    throw new Error(`OPÇÃO 3 FALHOU: Sem acesso a whatsapp_instances`);
  }

  const { data: leadsTest, error: leadsError } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('created_by_user_id', instanceTest.created_by_user_id)
    .limit(1);

  if (leadsError) {
    console.error(`[OPÇÃO 3] ❌ Erro acesso leads [${requestId}]:`, leadsError);
    throw new Error(`OPÇÃO 3 FALHOU: Sem acesso a leads`);
  }

  const { data: messagesTest, error: messagesError } = await supabaseAdmin
    .from('messages')
    .select('id')
    .eq('created_by_user_id', instanceTest.created_by_user_id)
    .limit(1);

  if (messagesError) {
    console.error(`[OPÇÃO 3] ❌ Erro acesso messages [${requestId}]:`, messagesError);
    throw new Error(`OPÇÃO 3 FALHOU: Sem acesso a messages`);
  }

  console.log(`[OPÇÃO 3] ✅ SERVICE ROLE funcionando [${requestId}] - Acesso a todas as tabelas confirmado`);
  
  // Se chegou aqui, tentar novamente a função save_whatsapp_message_simple
  const { data: result, error } = await supabaseAdmin.rpc('save_whatsapp_message_simple', {
    p_vps_instance_id: message.instanceId,
    p_phone: message.phone,
    p_message_text: message.messageText,
    p_from_me: message.fromMe,
    p_external_message_id: message.externalMessageId
  });

  if (error) {
    console.error(`[OPÇÃO 3] ❌ Função ainda falha mesmo com SERVICE ROLE [${requestId}]:`, error);
    throw new Error(`OPÇÃO 3: SERVICE ROLE OK mas função falha: ${error.message}`);
  }

  console.log(`[OPÇÃO 3] ✅ Sucesso total [${requestId}]:`, result);
  return { ...result, method: 'service_role_fixed' };
}

// Função auxiliar para formatar telefone brasileiro
function formatPhoneBrazilian(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    const areaCode = cleanPhone.substring(2, 4);
    const number = cleanPhone.substring(4);
    return `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5, 9)}`;
  } else if (cleanPhone.length === 11) {
    const areaCode = cleanPhone.substring(0, 2);
    const number = cleanPhone.substring(2);
    return `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5, 9)}`;
  } else {
    return `+55 ${cleanPhone}`;
  }
}

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
