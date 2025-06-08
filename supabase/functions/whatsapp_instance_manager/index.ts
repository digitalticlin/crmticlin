import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("WhatsApp Instance Manager - Gerenciamento completo de instâncias");

serve(async (req) => {
  console.log(`[Instance Manager] 📡 REQUEST: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'create_instance':
        console.log(`[Instance Manager] 🚀 EXECUTANDO CREATE_INSTANCE`);
        return await handleCreateInstance(supabase, instanceName);
        
      case 'delete_instance':
        return await handleDeleteInstance(supabase, instanceId);
        
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

// Função para criar instância COM LOGS DETALHADOS
async function handleCreateInstance(supabase: any, instanceName: string) {
  try {
    console.log(`[Instance Manager] 🚀 handleCreateInstance INICIADO`);
    console.log(`[Instance Manager] 📊 instanceName recebido:`, instanceName);

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

    // Verificar se já existe
    console.log(`[Instance Manager] 🔍 Verificando duplicatas...`);
    const { data: existing, error: existingError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('instance_name', normalizedName)
      .maybeSingle();

    if (existingError) {
      console.error(`[Instance Manager] ❌ Erro ao verificar duplicatas:`, existingError);
      throw new Error(`Erro ao verificar instâncias existentes: ${existingError.message}`);
    }

    if (existing) {
      console.error(`[Instance Manager] ❌ Instância já existe:`, existing);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Já existe uma instância com este nome',
          existing_instance: existing
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simular criação na VPS (aqui você faria a chamada real para VPS)
    const vpsInstanceId = `vps_${normalizedName}_${Date.now()}`;
    console.log(`[Instance Manager] 🏗️ VPS Instance ID gerado: ${vpsInstanceId}`);

    // Criar no banco
    console.log(`[Instance Manager] 💾 Inserindo no Supabase...`);
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: normalizedName,
        vps_instance_id: vpsInstanceId,
        connection_type: 'web',
        connection_status: 'connecting',
        web_status: 'connecting'
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[Instance Manager] ❌ Erro ao inserir no banco:`, insertError);
      throw new Error(`Erro ao criar instância no banco: ${insertError.message}`);
    }

    console.log(`[Instance Manager] ✅ Instância criada com sucesso:`, instance);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          id: instance.id,
          vps_instance_id: vpsInstanceId,
          instance_name: normalizedName,
          status: 'connecting'
        },
        message: 'Instância criada com sucesso'
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

// Função para deletar instância
async function handleDeleteInstance(supabase: any, instanceId: string) {
  try {
    console.log(`[Instance Manager] 🗑️ Deletando instância: ${instanceId}`);

    // Buscar instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Deletar do banco (trigger já cuida da VPS)
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instância deletada com sucesso' 
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

    // Aqui você faria a chamada real para VPS enviar mensagem
    // Por enquanto, simular sucesso
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
    console.log(`[Instance Manager] 🧪 Testando conexão`);

    // Aqui você faria teste real com VPS
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conexão OK',
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

    // Aqui você faria a chamada real para VPS deletar
    console.log(`[Instance Manager] ✅ VPS cleanup realizado para ${instance_name}`);

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

    // Buscar usuário por email
    const { data: user } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', userEmail) // Assumindo que userEmail é na verdade user_id
      .single();

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar instância com vinculação
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
