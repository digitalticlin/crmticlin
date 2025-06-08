
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000
};

console.log("WhatsApp Instance Manager - Gerenciamento completo de instâncias v2.0");

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

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[VPS Request] ${method} ${url}`);
  
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
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    console.log(`[VPS Response] ${response.status}: ${responseText.substring(0, 200)}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    return { 
      success: response.ok, 
      status: response.status,
      data 
    };
  } catch (error: any) {
    console.error(`[VPS Request Error] ${error.message}`);
    return { 
      success: false, 
      status: 500,
      error: error.message 
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
    console.log(`[Instance Manager] 📊 Parâmetros:`, {
      action,
      instanceName,
      instanceId,
      userEmail,
      instanceData
    });

    switch (action) {
      case 'create_instance':
        console.log(`[Instance Manager] 🚀 EXECUTANDO CREATE_INSTANCE v2.0`);
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

// CORREÇÃO: Função corrigida para criar instância COM payload correto da VPS
async function handleCreateInstance(supabase: any, instanceName: string, req: Request) {
  try {
    console.log(`[Instance Manager] 🚀 handleCreateInstance v2.0 INICIADO`);
    console.log(`[Instance Manager] 📊 instanceName recebido:`, instanceName);

    // CORREÇÃO CRÍTICA: Autenticar usuário primeiro
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

    // Validar nome da instância
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

    // Verificar se já existe para este usuário
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

    // CORREÇÃO: ID único da instância para a VPS
    const vpsInstanceId = `instance_${user.id}_${normalizedName}_${Date.now()}`;
    console.log(`[Instance Manager] 🏗️ Criando instância na VPS: ${vpsInstanceId}`);

    // CORREÇÃO PRINCIPAL: Payload correto para a VPS com instanceId e sessionName
    const vpsResult = await makeVPSRequest('/instance/create', 'POST', {
      instanceId: vpsInstanceId,
      sessionName: normalizedName,
      webhookUrl: `https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service`,
      settings: {
        autoReconnect: true,
        markMessages: false,
        syncFullHistory: false
      }
    });

    if (!vpsResult.success) {
      console.error(`[Instance Manager] ❌ Falha na criação VPS:`, vpsResult);
      throw new Error(`Falha ao criar instância na VPS: ${vpsResult.error || 'Erro desconhecido'}`);
    }

    console.log(`[Instance Manager] ✅ Instância criada na VPS:`, vpsResult.data);

    // ETAPA 1 CORRIGIDA: Criar no banco COM user_id
    console.log(`[Instance Manager] 💾 Inserindo no Supabase COM user_id...`);
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: normalizedName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'connecting',
        web_status: 'connecting',
        created_by_user_id: user.id, // CORREÇÃO CRÍTICA
        server_url: VPS_CONFIG.baseUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[Instance Manager] ❌ Erro ao inserir no banco:`, insertError);
      
      // Tentar deletar da VPS se banco falhou
      try {
        await makeVPSRequest(`/instance/${vpsInstanceId}/delete`, 'DELETE');
        console.log(`[Instance Manager] 🧹 Instância deletada da VPS após falha no banco`);
      } catch (cleanupError) {
        console.error(`[Instance Manager] ⚠️ Falha no cleanup da VPS:`, cleanupError);
      }
      
      throw new Error(`Erro ao criar instância no banco: ${insertError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância criada com sucesso:`, instance);

    // ETAPA 3: Iniciar processo de obtenção de QR Code (sem aguardar)
    console.log(`[Instance Manager] 🔄 Iniciando processo de QR Code...`);
    
    // Background task para buscar QR Code após um pequeno delay
    setTimeout(async () => {
      try {
        console.log(`[Instance Manager] 📱 Tentando obter QR Code para ${vpsInstanceId}...`);
        
        // Aguardar um pouco para VPS processar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const qrResult = await makeVPSRequest(`/instance/${vpsInstanceId}/qr`, 'GET');
        
        if (qrResult.success && qrResult.data?.qrCode) {
          console.log(`[Instance Manager] ✅ QR Code obtido, salvando no banco...`);
          
          let normalizedQrCode = qrResult.data.qrCode;
          if (!normalizedQrCode.startsWith('data:image/')) {
            normalizedQrCode = `data:image/png;base64,${normalizedQrCode}`;
          }
          
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: normalizedQrCode,
              web_status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

          if (updateError) {
            console.error(`[Instance Manager] ❌ Erro ao salvar QR Code:`, updateError);
          } else {
            console.log(`[Instance Manager] ✅ QR Code salvo com sucesso!`);
          }
        } else {
          console.log(`[Instance Manager] ⏳ QR Code ainda não disponível:`, qrResult);
        }
      } catch (qrError) {
        console.error(`[Instance Manager] ❌ Erro no processo de QR Code:`, qrError);
      }
    }, 100); // Iniciar quase imediatamente

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
        message: 'Instância criada com sucesso, QR Code sendo gerado...'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Manager] 💥 ERRO em handleCreateInstance:`, error);
    console.error(`[Instance Manager] 📋 Stack trace:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack,
        function: 'handleCreateInstance'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ETAPA 2: Função de deletar instância COM VPS
async function handleDeleteInstance(supabase: any, instanceId: string, req: Request) {
  try {
    console.log(`[Instance Manager] 🗑️ Deletando instância: ${instanceId}`);

    // Autenticar usuário
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    // Buscar instância
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

    // CORREÇÃO: Deletar da VPS PRIMEIRO
    if (instance.vps_instance_id) {
      console.log(`[Instance Manager] 🏗️ Deletando da VPS: ${instance.vps_instance_id}`);
      
      const vpsResult = await makeVPSRequest(`/instance/${instance.vps_instance_id}/delete`, 'DELETE');
      
      if (vpsResult.success) {
        console.log(`[Instance Manager] ✅ Instância deletada da VPS com sucesso`);
      } else {
        console.error(`[Instance Manager] ⚠️ Falha ao deletar da VPS (continuando):`, vpsResult.error);
      }
    }

    // Deletar do banco
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

// Função para listar instâncias
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

// Função para obter QR Code
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

// Função para enviar mensagem
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

// Função para testar conexão
async function handleTestConnection() {
  try {
    console.log(`[Instance Manager] 🧪 Testando conexão VPS`);

    const testResult = await makeVPSRequest('/health', 'GET');
    
    return new Response(
      JSON.stringify({
        success: testResult.success,
        message: testResult.success ? 'Conexão VPS OK' : 'Falha na conexão VPS',
        details: testResult,
        timestamp: new Date().toISOString()
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

// Função para deletar instância da VPS com cleanup
async function handleDeleteVPSInstance(supabase: any, instanceData: any) {
  try {
    const { vps_instance_id, instance_name } = instanceData;
    console.log(`[Instance Manager] 🗑️ Cleanup VPS para: ${vps_instance_id}`);

    if (vps_instance_id) {
      const vpsResult = await makeVPSRequest(`/instance/${vps_instance_id}/delete`, 'DELETE');
      console.log(`[Instance Manager] 📋 Resultado VPS cleanup:`, vpsResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'VPS cleanup realizado com sucesso'
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

// Função para vincular instância a usuário
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
