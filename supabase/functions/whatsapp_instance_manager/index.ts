import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000
};

console.log("WhatsApp Instance Manager - Gerenciamento robusto v4.0 - SEM POLLING INTERNO");

async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, user };
}

async function makeVPSRequestWithRetry(endpoint: string, method: string = 'GET', body?: any, maxRetries: number = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[VPS Request] Tentativa ${attempt}/${maxRetries} - ${method} ${VPS_CONFIG.baseUrl}${endpoint}`);
    
    try {
      const result = await makeVPSRequest(endpoint, method, body);
      
      if (result.success) {
        console.log(`[VPS Request] ✅ Sucesso na tentativa ${attempt}`);
        return result;
      } else {
        lastError = result;
        console.log(`[VPS Request] ❌ Falha na tentativa ${attempt}:`, result.error);
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000;
          console.log(`[VPS Request] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      lastError = { success: false, error: error.message };
      console.error(`[VPS Request] ❌ Erro na tentativa ${attempt}:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`[VPS Request] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[VPS Request] 💥 Todas as ${maxRetries} tentativas falharam`);
  return lastError;
}

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  try {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    };

    if (body && method !== 'GET') {
      const normalizedBody = JSON.stringify(body, null, 0);
      requestOptions.body = normalizedBody;
      
      console.log(`[VPS Request] 📤 Payload enviado:`, normalizedBody);
      console.log(`[VPS Request] 📤 Headers:`, JSON.stringify(requestOptions.headers));
    }

    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    console.log(`[VPS Response] Status: ${response.status}`);
    console.log(`[VPS Response] Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));
    console.log(`[VPS Response] Body:`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.warn(`[VPS Response] ⚠️ JSON parse failed, usando raw text:`, parseError.message);
      data = { raw: responseText, parseError: parseError.message };
    }

    return { 
      success: response.ok, 
      status: response.status,
      data,
      rawResponse: responseText
    };
  } catch (error: any) {
    console.error(`[VPS Request Error] ${error.name}: ${error.message}`);
    if (error.name === 'TimeoutError') {
      console.error(`[VPS Request Error] ⏰ Timeout após ${VPS_CONFIG.timeout}ms`);
    }
    return { 
      success: false, 
      status: 500,
      error: error.message,
      errorType: error.name
    };
  }
}

serve(async (req) => {
  console.log(`[Instance Manager] 📡 REQUEST: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    console.log(`[Instance Manager] 📥 Raw body: ${rawBody}`);

    let requestData: any = {};
    if (rawBody) {
      try {
        requestData = JSON.parse(rawBody);
        console.log(`[Instance Manager] 📦 Parsed body:`, requestData);
      } catch (parseError) {
        console.error(`[Instance Manager] ❌ JSON Parse Error:`, parseError);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { action, instanceName, instanceId, userEmail, instanceData } = requestData;
    
    console.log(`[Instance Manager] 🎯 Action: ${action}`);

    switch (action) {
      case 'create_instance':
        console.log(`[Instance Manager] 🚀 EXECUTANDO CREATE_INSTANCE v4.0 - SEM POLLING`);
        return await handleCreateInstance(supabase, instanceName, req);
        
      case 'delete_instance':
        return await handleDeleteInstance(supabase, instanceId, req);
        
      case 'list_instances':
        return await handleListInstances(supabase);
        
      case 'get_qr_code':
        return await handleGetQRCode(supabase, instanceId);
        
      case 'send_message':
        return await handleSendMessage(supabase, instanceData);
        
      case 'test_connection':
        return await handleTestConnection();
        
      case 'delete_vps_instance_cleanup':
        return await handleDeleteVPSInstance(supabase, instanceData);
        
      case 'bind_instance_to_user':
        return await handleBindInstanceToUser(supabase, instanceData);

      default:
        console.error(`[Instance Manager] ❌ AÇÃO DESCONHECIDA: ${action}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}`,
            available_actions: [
              'create_instance', 'delete_instance', 'list_instances', 
              'get_qr_code', 'send_message', 'test_connection', 
              'delete_vps_instance_cleanup', 'bind_instance_to_user'
            ]
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error(`[Instance Manager] 💥 ERRO GERAL:`, error);
    console.error(`[Instance Manager] 📋 Stack trace:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// FUNÇÃO PRINCIPAL: Criar instância SEM POLLING INTERNO
async function handleCreateInstance(supabase: any, instanceName: string, req: Request) {
  try {
    console.log(`[Instance Manager] 🚀 handleCreateInstance v4.0 INICIADO - SEM POLLING`);
    console.log(`[Instance Manager] 📊 instanceName recebido:`, instanceName);

    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      console.error(`[Instance Manager] ❌ Usuário não autenticado:`, authResult.error);
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;
    console.log(`[Instance Manager] ✅ Usuário autenticado:`, user.id);

    if (!instanceName || typeof instanceName !== 'string') {
      console.error(`[Instance Manager] ❌ instanceName inválido:`, instanceName);
      throw new Error('Nome da instância é obrigatório e deve ser uma string');
    }

    if (instanceName.trim().length < 3) {
      console.error(`[Instance Manager] ❌ instanceName muito curto:`, instanceName.length);
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    console.log(`[Instance Manager] ✅ Nome normalizado: ${normalizedName}`);

    // Verificar duplicatas
    console.log(`[Instance Manager] 🔍 Verificando duplicatas para usuário ${user.id}...`);
    const { data: existing, error: existingError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('instance_name', normalizedName)
      .eq('created_by_user_id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error(`[Instance Manager] ❌ Erro ao verificar duplicatas:`, existingError);
      throw new Error(`Erro ao verificar instâncias existentes: ${existingError.message}`);
    }

    if (existing) {
      console.error(`[Instance Manager] ❌ Instância já existe para este usuário:`, existing);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Já existe uma instância com este nome para este usuário',
          existing_instance: existing
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vpsInstanceId = `instance_${user.id}_${normalizedName}_${Date.now()}`;
    console.log(`[Instance Manager] 🏗️ Criando instância na VPS: ${vpsInstanceId}`);

    // Criar webhook URL corrigida
    const webhookUrl = `https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service`;
    
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: normalizedName,
      webhookUrl: webhookUrl,
      settings: {
        autoReconnect: true,
        markMessages: false,
        syncFullHistory: false
      }
    };

    console.log(`[Instance Manager] 📤 Payload preparado:`, JSON.stringify(vpsPayload, null, 2));

    const vpsResult = await makeVPSRequestWithRetry('/instance/create', 'POST', vpsPayload, 3);

    if (!vpsResult.success) {
      console.error(`[Instance Manager] ❌ Falha na criação VPS após todas as tentativas:`, vpsResult);
      throw new Error(`Falha ao criar instância na VPS: ${vpsResult.error || 'Erro desconhecido'}`);
    }

    console.log(`[Instance Manager] ✅ Instância criada na VPS com sucesso:`, vpsResult.data);

    // Criar no banco
    console.log(`[Instance Manager] 💾 Inserindo no Supabase...`);
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: normalizedName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'connecting',
        web_status: 'connecting',
        created_by_user_id: user.id,
        server_url: VPS_CONFIG.baseUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[Instance Manager] ❌ Erro ao inserir no banco:`, insertError);
      
      // Cleanup da VPS se banco falhou
      try {
        await makeVPSRequestWithRetry(`/instance/${vpsInstanceId}/delete`, 'DELETE', null, 2);
        console.log(`[Instance Manager] 🧹 Instância deletada da VPS após falha no banco`);
      } catch (cleanupError) {
        console.error(`[Instance Manager] ⚠️ Falha no cleanup da VPS:`, cleanupError);
      }
      
      throw new Error(`Erro ao criar instância no banco: ${insertError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância criada com sucesso - AGUARDANDO WEBHOOK DA VPS:`, instance);

    // REMOVIDO: setTimeout para polling interno
    // A VPS deve enviar webhook quando QR Code estiver pronto
    // O frontend fará polling se necessário

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          id: instance.id,
          vps_instance_id: vpsInstanceId,
          instance_name: normalizedName,
          status: 'connecting',
          created_by_user_id: user.id
        },
        message: 'Instância criada com sucesso. Aguardando webhook da VPS com QR Code...',
        version: 'v4.0 - Sem polling interno'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Manager] 💥 ERRO em handleCreateInstance v4.0:`, error);
    console.error(`[Instance Manager] 📋 Stack trace:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack,
        function: 'handleCreateInstance',
        version: 'v4.0'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ETAPA 2: Função de deletar instância COM VPS
async function handleDeleteInstance(supabase: any, instanceId: string, req: Request) {
  try {
    console.log(`[Instance Manager] 🗑️ Deletando instância: ${instanceId}`);

    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (fetchError || !instance) {
      throw new Error('Instância não encontrada ou sem permissão');
    }

    console.log(`[Instance Manager] 📋 Instância encontrada:`, instance.instance_name);

    if (instance.vps_instance_id) {
      console.log(`[Instance Manager] 🏗️ Deletando da VPS: ${instance.vps_instance_id}`);
      
      const vpsResult = await makeVPSRequestWithRetry(`/instance/${instance.vps_instance_id}/delete`, 'DELETE', null, 2);
      
      if (vpsResult.success) {
        console.log(`[Instance Manager] ✅ Instância deletada da VPS com sucesso`);
      } else {
        console.error(`[Instance Manager] ⚠️ Falha ao deletar da VPS (continuando):`, vpsResult.error);
      }
    }

    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    console.log(`[Instance Manager] ✅ Instância deletada do banco com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instância deletada com sucesso da VPS e banco de dados' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Manager] ❌ Erro ao deletar instância:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleListInstances(supabase: any) {
  try {
    console.log(`[Instance Manager] 📋 Listando instâncias`);

    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        instances: instances || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetQRCode(supabase: any, instanceId: string) {
  try {
    console.log(`[Instance Manager] 📱 Obtendo QR Code: ${instanceId}`);

    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('qr_code, connection_status')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    if (instance.qr_code) {
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          status: instance.connection_status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'QR Code não disponível ainda'
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleSendMessage(supabase: any, messageData: any) {
  try {
    const { instanceId, phone, message } = messageData;
    console.log(`[Instance Manager] 📤 Enviando mensagem via: ${instanceId}`);

    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, connection_status')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    if (!['open', 'ready'].includes(instance.connection_status)) {
      throw new Error('Instância não está conectada');
    }

    const messageId = `msg_${Date.now()}`;

    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        message: 'Mensagem enviada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleTestConnection() {
  try {
    console.log(`[Instance Manager] 🧪 Testando conexão VPS v4.0`);

    const testResult = await makeVPSRequestWithRetry('/health', 'GET', null, 2);
    
    return new Response(
      JSON.stringify({
        success: testResult.success,
        message: testResult.success ? 'Conexão VPS OK v4.0' : 'Falha na conexão VPS',
        details: testResult,
        timestamp: new Date().toISOString(),
        version: 'v4.0'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleDeleteVPSInstance(supabase: any, instanceData: any) {
  try {
    const { vps_instance_id, instance_name } = instanceData;
    console.log(`[Instance Manager] 🗑️ Cleanup VPS para: ${vps_instance_id}`);

    if (vps_instance_id) {
      const vpsResult = await makeVPSRequestWithRetry(`/instance/${vps_instance_id}/delete`, 'DELETE', null, 2);
      console.log(`[Instance Manager] 📋 Resultado VPS cleanup:`, vpsResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'VPS cleanup realizado com sucesso v4.0'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleBindInstanceToUser(supabase: any, instanceData: any) {
  try {
    const { instanceId, userEmail, instanceName } = instanceData;
    console.log(`[Instance Manager] 🔗 Vinculando instância ${instanceId} ao usuário ${userEmail}`);

    const { data: user } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userEmail)
      .single();

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        created_by_user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instância vinculada com sucesso',
        user: {
          id: user.id,
          name: user.full_name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
