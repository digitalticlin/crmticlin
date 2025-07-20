
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`[${requestId}] 🚀 WEBHOOK V87 - BYPASS TOTAL RLS`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ROTA DE DIAGNÓSTICO
  if (req.method === 'GET' && new URL(req.url).pathname.includes('/diagnostic')) {
    console.log(`[${requestId}] 🔬 EXECUTANDO DIAGNÓSTICO...`);
    return await runDiagnostic(requestId);
  }

  if (req.method !== 'POST') {
    console.log(`[${requestId}] ❌ Método não permitido: ${req.method}`);
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // CORREÇÃO CRÍTICA: Cliente Supabase usando service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // CORREÇÃO: Teste de conectividade simples
    console.log(`[${requestId}] 🔍 Testando conectividade básica...`);
    const { error: connectionTest } = await supabase.from('whatsapp_instances').select('id').limit(1);
    if (connectionTest) {
      console.error(`[${requestId}] ❌ Erro de conectividade:`, connectionTest);
      throw new Error(`Database connection failed: ${connectionTest.message}`);
    }
    console.log(`[${requestId}] ✅ Conectividade confirmada`);

    const payload = await req.json();
    console.log(`[${requestId}] 📥 Payload recebido:`, JSON.stringify(payload, null, 2));
    
    const eventType = payload.event || payload.type;
    const instanceId = payload.instanceId || payload.instance || payload.instanceName;
    
    if (!instanceId) {
      console.error(`[${requestId}] ❌ instanceId não fornecido`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'instanceId é obrigatório',
        requestId
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📝 Evento: ${eventType} | Instância: ${instanceId}`);

    // Processar apenas mensagens
    if (eventType === 'messages.upsert' || eventType === 'message_received') {
      console.log(`[${requestId}] 💬 PROCESSANDO MENSAGEM`);
      return await processMessage(supabase, payload, instanceId, requestId);
    }

    // Ignorar outros eventos
    console.log(`[${requestId}] ⏭️ Evento ignorado: ${eventType}`);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Evento ignorado',
      event: eventType,
      requestId
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ ERRO FATAL:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function processMessage(supabase: any, payload: any, instanceId: string, requestId: string) {
  try {
    console.log(`[${requestId}] 🔍 Buscando instância: ${instanceId}`);
    
    // CORREÇÃO: Buscar instância usando RLS
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, created_by_user_id, instance_name, vps_instance_id')
      .eq('vps_instance_id', instanceId);

    if (instanceError) {
      console.error(`[${requestId}] ❌ Erro ao buscar instância:`, instanceError);
      throw new Error(`Erro ao buscar instância: ${instanceError.message}`);
    }

    if (!instances || instances.length === 0) {
      console.error(`[${requestId}] ❌ Instância não encontrada: ${instanceId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Instância não encontrada',
        instanceId,
        requestId
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const instance = instances[0];
    console.log(`[${requestId}] ✅ Instância encontrada:`, {
      id: instance.id,
      name: instance.instance_name,
      userId: instance.created_by_user_id
    });

    // Extração de dados da mensagem
    const messageData = extractMessageData(payload, requestId);
    
    if (!messageData) {
      console.error(`[${requestId}] ❌ Dados da mensagem inválidos`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Dados da mensagem inválidos',
        requestId
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[${requestId}] 📞 Dados processados:`, {
      phone: `${messageData.phone.substring(0, 4)}****`,
      fromMe: messageData.fromMe,
      mediaType: messageData.mediaType,
      textLength: messageData.text?.length || 0
    });

    // CORREÇÃO RADICAL: Salvar mensagem PRIMEIRO, sem dependência de leads
    console.log(`[${requestId}] 🚀 ESTRATÉGIA NOVA: Salvar mensagem independente de leads`);
    
    const message = await saveMessageIndependent(supabase, {
      whatsapp_number_id: instance.id,
      text: messageData.text,
      from_me: messageData.fromMe,
      timestamp: new Date().toISOString(),
      status: messageData.fromMe ? 'sent' : 'received',
      created_by_user_id: instance.created_by_user_id,
      media_type: messageData.mediaType,
      media_url: messageData.mediaUrl,
      import_source: 'realtime',
      external_message_id: messageData.messageId,
      // NOVOS CAMPOS: Armazenar dados do lead DENTRO da mensagem
      contact_phone: messageData.phone,
      contact_name: `Contato ${messageData.phone}`
    }, requestId);

    // SEGUNDO PASSO: Tentar processar leads de forma opcional (não crítica)
    let leadId = null;
    try {
      const lead = await findOrCreateLeadSafe(supabase, messageData.phone, instance, requestId);
      if (lead?.id) {
        leadId = lead.id;
        // Tentar vincular lead à mensagem (se possível)
        await linkMessageToLead(supabase, message.id, lead.id, requestId);
      }
    } catch (leadError) {
      console.warn(`[${requestId}] ⚠️ Erro no processamento de lead (não crítico):`, leadError.message);
    }

    console.log(`[${requestId}] ✅ MENSAGEM SALVA COM SUCESSO! ID: ${message.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Mensagem processada com sucesso',
      data: {
        phone: messageData.phone,
        fromMe: messageData.fromMe,
        leadId: leadId,
        messageId: message.id,
        instanceId: instance.id,
        mediaType: messageData.mediaType,
        method: 'independent_save'
      },
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro no processamento:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      requestId
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

function extractMessageData(payload: any, requestId: string) {
  console.log(`[${requestId}] 🔍 Extraindo dados da mensagem...`);
  
    let messageText = '';
    let mediaType = 'text';
    let mediaUrl = null;
    let fromMe = false;
    let phone = '';
  let messageId = '';

    const messageData = payload.data || payload.message || payload;
    
  // Detectar direção da mensagem
  fromMe = messageData?.fromMe !== undefined ? messageData.fromMe : 
           payload.fromMe !== undefined ? payload.fromMe : false;

  // Extrair telefone
    phone = extractPhoneFromMessage(messageData) || 
            extractPhoneFromMessage(payload) ||
            payload.from?.replace('@s.whatsapp.net', '') ||
          payload.phone || '';

  if (!phone) {
    console.error(`[${requestId}] ❌ Telefone não encontrado`);
    return null;
  }

  // Extrair ID da mensagem
  messageId = messageData?.key?.id || 
              messageData?.messageId || 
              payload.messageId || 
              `${payload.instanceId || 'unknown'}_${Date.now()}`;

  // Extrair conteúdo baseado no tipo de mídia
  if (messageData?.message) {
    const msg = messageData.message;
    
    if (msg.conversation) {
        messageText = msg.conversation;
        mediaType = 'text';
    }
    else if (msg.extendedTextMessage?.text) {
        messageText = msg.extendedTextMessage.text;
        mediaType = 'text';
    }
    else if (msg.imageMessage) {
        messageText = msg.imageMessage.caption || '[Imagem]';
        mediaType = 'image';
      mediaUrl = msg.imageMessage.url || null;
    }
    else if (msg.videoMessage) {
        messageText = msg.videoMessage.caption || '[Vídeo]';
        mediaType = 'video';
      mediaUrl = msg.videoMessage.url || null;
    }
    else if (msg.audioMessage) {
        messageText = '[Áudio]';
        mediaType = 'audio';
      mediaUrl = msg.audioMessage.url || null;
    }
    else if (msg.documentMessage) {
      messageText = msg.documentMessage.title || msg.documentMessage.fileName || '[Documento]';
        mediaType = 'document';
      mediaUrl = msg.documentMessage.url || null;
    }
    else if (msg.stickerMessage) {
      messageText = '[Sticker]';
      mediaType = 'image';
      mediaUrl = msg.stickerMessage.url || null;
    }
  }
  else {
      messageText = messageData.body || 
                   messageData.text || 
                   payload.message?.text ||
                   payload.text ||
                   payload.body ||
                  '[Mensagem sem texto]';
    
    if (payload.messageType) {
      mediaType = payload.messageType;
    } else if (messageData.messageType) {
      mediaType = messageData.messageType;
    }
    
    mediaUrl = messageData.mediaUrl || payload.mediaUrl || null;
  }

  return {
    phone,
    text: messageText,
    fromMe,
    mediaType,
    mediaUrl,
    messageId
  };
}

function extractPhoneFromMessage(messageData: any): string | null {
  if (!messageData) return null;
  
  const remoteJid = messageData.key?.remoteJid || 
                    messageData.from || 
                    messageData.remoteJid;
  
  if (!remoteJid) return null;
  
  const phoneMatch = remoteJid.match(/(\d+)@/);
  return phoneMatch ? phoneMatch[1] : null;
}



// NOVA ESTRATÉGIA: Salvar mensagem sem dependência de leads
async function saveMessageIndependent(supabase: any, messageData: any, requestId: string) {
  console.log(`[${requestId}] 💾 SALVANDO MENSAGEM INDEPENDENTE - Estratégias múltiplas para schema`);
  console.log(`[${requestId}] 🔐 Cliente Supabase configurado com service_role`);
  
  // DEBUG: Verificar qual usuário está autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log(`[${requestId}] 👤 Usuário autenticado:`, user ? `${user.id} (${user.role})` : 'Anônimo');
  if (userError) console.log(`[${requestId}] ❌ Erro ao buscar usuário:`, userError);
  console.log(`[${requestId}] 📋 Dados a inserir:`, JSON.stringify({
    whatsapp_number_id: messageData.whatsapp_number_id,
    from_me: messageData.from_me,
    text_length: messageData.text?.length || 0,
    created_by_user_id: messageData.created_by_user_id,
    contact_phone: messageData.contact_phone
  }, null, 2));
  
  try {
    // ESTRATÉGIA ÚNICA: CLIENTE ESPECIAL PARA BYPASS RLS
    console.log(`[${requestId}] 🚀 CRIANDO CLIENTE COM BYPASS RLS TOTAL`);
    
    // Criar cliente especial apenas para esta inserção
    const bypassClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        },
        global: {
          headers: {
            'X-Client-Info': 'edge-function-bypass',
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          }
        }
      }
    );
    
    console.log(`[${requestId}] 🔧 Cliente bypass criado, tentando inserção...`);
    
    let { data: savedMessage, error: messageError } = await bypassClient
      .from('messages')
      .insert({
        text: messageData.text,
        from_me: messageData.from_me,
        timestamp: messageData.timestamp,
        status: messageData.status,
        created_by_user_id: messageData.created_by_user_id,
        media_type: messageData.media_type,
        media_url: messageData.media_url,
        import_source: messageData.import_source,
        external_message_id: messageData.external_message_id,
        whatsapp_number_id: messageData.whatsapp_number_id
      })
      .select('id')
      .single();

        if (messageError) {
      console.log(`[${requestId}] ❌ Cliente bypass falhou:`, messageError);
    } else {
      console.log(`[${requestId}] ✅ Cliente bypass funcionou! ID: ${savedMessage.id}`);
    }

    if (messageError) {
      console.error(`[${requestId}] ❌ Erro ao salvar mensagem independente:`, messageError);
      throw new Error(`Falha ao salvar mensagem: ${messageError.message}`);
    }

    console.log(`[${requestId}] ✅ Mensagem salva independentemente! ID: ${savedMessage.id}`);
    return savedMessage;

  } catch (error) {
    console.error(`[${requestId}] ❌ Erro ao salvar mensagem independente:`, error);
    throw error;
  }
}

// Função segura para encontrar/criar leads (sem falhar a mensagem)
async function findOrCreateLeadSafe(supabase: any, phone: string, instance: any, requestId: string) {
  console.log(`[${requestId}] 👤 [SAFE] Buscando lead para telefone: ${phone}`);
  
  try {
    // Tentar operação com leads de forma segura
    const { data: existingLead, error: searchError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .eq('created_by_user_id', instance.created_by_user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchError) {
      console.warn(`[${requestId}] ⚠️ [SAFE] Erro ao buscar lead:`, searchError);
      return null;
    }

    if (existingLead) {
      console.log(`[${requestId}] 👤 [SAFE] Lead encontrado: ${existingLead.id}`);
      return existingLead;
    }

    // Tentar criar novo lead
    const { data: newLead, error: createError } = await supabase
      .from('leads')
      .insert({
        phone: phone,
        name: `Contato ${phone}`,
        whatsapp_number_id: instance.id,
        created_by_user_id: instance.created_by_user_id,
        last_message_time: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.warn(`[${requestId}] ⚠️ [SAFE] Erro ao criar lead:`, createError);
      return null;
    }

    console.log(`[${requestId}] ✅ [SAFE] Lead criado: ${newLead.id}`);
    return newLead;

  } catch (error) {
    console.warn(`[${requestId}] ⚠️ [SAFE] Erro geral com leads:`, error.message);
    return null;
  }
}

// Função para tentar vincular mensagem ao lead (opcional)
async function linkMessageToLead(supabase: any, messageId: string, leadId: string, requestId: string) {
  try {
    console.log(`[${requestId}] 🔗 Tentando vincular mensagem ${messageId} ao lead ${leadId}`);
    
    const { error: linkError } = await supabase
      .from('messages')
      .update({ lead_id: leadId })
      .eq('id', messageId);
      
    if (linkError) {
      console.warn(`[${requestId}] ⚠️ Erro ao vincular (não crítico):`, linkError);
    } else {
      console.log(`[${requestId}] ✅ Mensagem vinculada ao lead com sucesso`);
    }
  } catch (error) {
    console.warn(`[${requestId}] ⚠️ Erro ao vincular mensagem:`, error.message);
  }
}

// FUNÇÃO DE DIAGNÓSTICO INTEGRADA
async function runDiagnostic(requestId: string) {
  const results = {
    diagnosticId: requestId,
    timestamp: new Date().toISOString(),
    tests: {},
    summary: { passed: 0, failed: 0, warnings: 0 }
  };

  try {
    console.log(`[${requestId}] 🔬 INICIANDO DIAGNÓSTICO SISTEMÁTICO`);

    // TESTE 1: Variáveis de Ambiente
    console.log(`[${requestId}] 🧪 TESTE 1: Variáveis de Ambiente`);
    const envTest = await testEnvironmentVariables(requestId);
    results.tests.environment = envTest;
    updateSummary(results.summary, envTest);

    // TESTE 2: Conectividade Básica
    console.log(`[${requestId}] 🧪 TESTE 2: Conectividade Básica`);
    const connectTest = await testBasicConnectivity(requestId);
    results.tests.connectivity = connectTest;
    updateSummary(results.summary, connectTest);

    // TESTE 3: Schemas e Tabelas
    console.log(`[${requestId}] 🧪 TESTE 3: Schemas e Tabelas`);
    const schemaTest = await testSchemasAndTables(requestId);
    results.tests.schemas = schemaTest;
    updateSummary(results.summary, schemaTest);

    // TESTE 4: Inserção Mínima
    console.log(`[${requestId}] 🧪 TESTE 4: Inserção Mínima`);
    const insertTest = await testMinimalInsert(requestId);
    results.tests.insertion = insertTest;
    updateSummary(results.summary, insertTest);

    console.log(`[${requestId}] ✅ DIAGNÓSTICO COMPLETO - ${results.summary.passed} passou, ${results.summary.failed} falhou, ${results.summary.warnings} avisos`);

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ ERRO FATAL NO DIAGNÓSTICO:`, error);
    results.tests.fatal = {
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    };
    results.summary.failed++;

    return new Response(JSON.stringify(results, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// TESTE 1: Verificar variáveis de ambiente
async function testEnvironmentVariables(diagnosticId: string) {
  const test = { status: 'RUNNING', details: {} };
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    test.details = {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      serviceKey: serviceKey ? `${serviceKey.substring(0, 20)}...` : 'MISSING',
      anonKey: anonKey ? `${anonKey.substring(0, 20)}...` : 'MISSING',
      hasAll: !!(supabaseUrl && serviceKey)
    };

    if (!supabaseUrl || !serviceKey) {
      test.status = 'FAILED';
      test.error = 'Variáveis de ambiente obrigatórias ausentes';
    } else {
      test.status = 'PASSED';
    }

    console.log(`[${diagnosticId}] 📊 Env vars:`, test.details);
    
  } catch (error) {
    test.status = 'FAILED';
    test.error = error.message;
  }
  
  return test;
}

// TESTE 2: Conectividade básica
async function testBasicConnectivity(diagnosticId: string) {
  const test = { status: 'RUNNING', details: {} };
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceKey) {
      test.status = 'SKIPPED';
      test.reason = 'Env vars não disponíveis';
      return test;
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Teste de ping básico
    const startTime = Date.now();
    const { data, error } = await supabase.from('whatsapp_instances').select('count').limit(1);
    const duration = Date.now() - startTime;

    test.details = {
      duration: `${duration}ms`,
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code
    };

    if (error) {
      test.status = 'FAILED';
      test.error = error.message;
    } else {
      test.status = 'PASSED';
    }

    console.log(`[${diagnosticId}] 🌐 Conectividade:`, test.details);
    
  } catch (error) {
    test.status = 'FAILED';
    test.error = error.message;
  }
  
  return test;
}

// TESTE 3: Verificar schemas e tabelas
async function testSchemasAndTables(diagnosticId: string) {
  const test = { status: 'RUNNING', details: {} };
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verificar se consegue ver as tabelas essenciais
    const tables = ['messages', 'leads', 'whatsapp_instances'];
    const tableTests = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        tableTests[table] = {
          accessible: !error,
          error: error?.message,
          errorCode: error?.code,
          hasData: !!data && data.length > 0
        };
      } catch (err) {
        tableTests[table] = {
          accessible: false,
          error: err.message
        };
      }
    }

    test.details = { tables: tableTests };

    // Verificar se todas as tabelas essenciais são acessíveis
    const accessibleTables = Object.values(tableTests).filter(t => t.accessible).length;
    if (accessibleTables === tables.length) {
      test.status = 'PASSED';
    } else if (accessibleTables > 0) {
      test.status = 'WARNING';
      test.warning = `Apenas ${accessibleTables}/${tables.length} tabelas acessíveis`;
    } else {
      test.status = 'FAILED';
      test.error = 'Nenhuma tabela essencial acessível';
    }

    console.log(`[${diagnosticId}] 🗄️ Schemas:`, test.details);
    
  } catch (error) {
    test.status = 'FAILED';
    test.error = error.message;
  }
  
  return test;
}

// TESTE 4: Inserção mínima
async function testMinimalInsert(diagnosticId: string) {
  const test = { status: 'RUNNING', details: {} };
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabase = createClient(supabaseUrl, serviceKey);

    // Tentar inserção mais simples possível
    const testData = {
      text: `Teste diagnóstico ${diagnosticId}`,
      created_by_user_id: '00000000-0000-0000-0000-000000000000',
      from_me: false,
      timestamp: new Date().toISOString(),
      status: 'received',
      import_source: 'diagnostic'
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(testData)
      .select('id')
      .single();

    test.details = {
      insertSuccess: !error,
      insertedId: data?.id,
      error: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorHint: error?.hint,
      testData: testData
    };

    if (error) {
      test.status = 'FAILED';
      test.error = error.message;
    } else {
      test.status = 'PASSED';
      // Tentar limpar o teste
      try {
        await supabase.from('messages').delete().eq('id', data.id);
        test.details.cleanupSuccess = true;
      } catch (cleanupError) {
        test.details.cleanupSuccess = false;
        test.details.cleanupError = cleanupError.message;
      }
    }

    console.log(`[${diagnosticId}] 💾 Inserção mínima:`, test.details);
    
  } catch (error) {
    test.status = 'FAILED';
    test.error = error.message;
  }
  
  return test;
}

// Função auxiliar para atualizar sumário
function updateSummary(summary: any, test: any) {
  switch (test.status) {
    case 'PASSED':
      summary.passed++;
      break;
    case 'FAILED':
      summary.failed++;
      break;
    case 'WARNING':
      summary.warnings++;
      break;
  }
}
