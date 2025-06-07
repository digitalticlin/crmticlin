
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  timeout: 30000
};

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
    console.log(`[VPS Request] ${method} ${url}`);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `VPS Error: ${response.status} - ${data.message || 'Unknown error'}`,
        data: null
      };
    }

    return {
      success: true,
      data,
      error: null
    };

  } catch (error) {
    console.error('[VPS Request] Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

async function createWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  const creationId = `create_${Date.now()}`;
  console.log(`[Instance Creation] 🚀 Criando instância [${creationId}]:`, instanceData);

  try {
    const { instanceName } = instanceData;
    
    if (!instanceName) {
      throw new Error('Nome da instância é obrigatório');
    }

    // 1. Verificar se já existe instância com esse nome
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name')
      .eq('instance_name', instanceName)
      .eq('created_by_user_id', userId)
      .maybeSingle();

    if (existingInstance) {
      throw new Error(`Já existe uma instância com o nome "${instanceName}"`);
    }

    // 2. Gerar ID único para VPS
    const vpsInstanceId = `whatsapp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[Instance Creation] 📱 VPS Instance ID: ${vpsInstanceId}`);

    // 3. Buscar company_id do usuário
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile?.company_id) {
      companyId = userProfile.company_id;
    }

    // 4. Salvar no banco PRIMEIRO
    const instanceRecord = {
      instance_name: instanceName,
      vps_instance_id: vpsInstanceId,
      company_id: companyId,
      created_by_user_id: userId,
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      web_status: 'connecting',
      connection_status: 'connecting',
      qr_code: null,
      created_at: new Date().toISOString()
    };

    console.log(`[Instance Creation] 💾 Salvando no Supabase [${creationId}]`);
    
    const { data: savedInstance, error: saveError } = await supabase
      .from('whatsapp_instances')
      .insert(instanceRecord)
      .select()
      .single();

    if (saveError) {
      console.error(`[Instance Creation] ❌ Erro ao salvar [${creationId}]:`, saveError);
      throw new Error(`Erro ao salvar instância: ${saveError.message}`);
    }

    console.log(`[Instance Creation] ✅ Instância salva [${creationId}]:`, savedInstance.id);

    // 5. Criar na VPS
    const webhookUrl = 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web';
    const vpsPayload = {
      instanceId: vpsInstanceId,
      sessionName: instanceName,
      webhookUrl: webhookUrl,
      companyId: companyId || userId,
      webhook: true,
      webhook_by_events: true,
      webhookEvents: ['messages.upsert', 'qr.update', 'connection.update']
    };

    console.log(`[Instance Creation] 🌐 Criando na VPS [${creationId}]`);
    const vpsResponse = await makeVPSRequest('/instance/create', 'POST', vpsPayload);
    
    if (!vpsResponse.success) {
      console.error(`[Instance Creation] ❌ VPS falhou [${creationId}]:`, vpsResponse.error);
      
      // Marcar como erro mas manter no banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          web_status: 'error',
          connection_status: 'disconnected'
        })
        .eq('id', savedInstance.id);
      
      throw new Error(`Falha ao criar instância na VPS: ${vpsResponse.error}`);
    }

    console.log(`[Instance Creation] ✅ VPS criou instância [${creationId}]`);

    // 6. Atualizar status após sucesso na VPS
    const { data: updatedInstance } = await supabase
      .from('whatsapp_instances')
      .update({ 
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('id', savedInstance.id)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        instance: updatedInstance || savedInstance,
        vpsInstanceId: vpsInstanceId,
        qrCode: null,
        creationId,
        message: 'Instância criada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Instance Creation] ❌ ERRO [${creationId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        creationId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // Buscar instância no banco
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Se já tem QR code válido, retornar
    if (instance.qr_code && instance.qr_code.length > 100) {
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          source: 'database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar QR code da VPS
    const vpsResponse = await makeVPSRequest(`/instance/${instance.vps_instance_id}/qr`, 'GET');
    
    if (vpsResponse.success && vpsResponse.data?.qrCode) {
      const qrCode = vpsResponse.data.qrCode.startsWith('data:image/') 
        ? vpsResponse.data.qrCode 
        : `data:image/png;base64,${vpsResponse.data.qrCode}`;

      // Salvar QR code no banco
      await supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: qrCode,
          source: 'vps'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'QR Code não disponível ainda',
        waiting: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[QR Code] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function deleteWhatsAppInstance(supabase: any, instanceData: any, userId: string) {
  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // Buscar instância no banco
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    // Deletar da VPS se tiver vps_instance_id
    if (instance.vps_instance_id) {
      const vpsResponse = await makeVPSRequest('/instance/delete', 'POST', {
        instanceId: instance.vps_instance_id
      });
      
      if (!vpsResponse.success) {
        console.warn('[Delete Instance] VPS delete failed:', vpsResponse.error);
        // Continuar mesmo se a VPS falhar
      }
    }

    // Deletar do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instância deletada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Delete Instance] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function checkServerHealth(supabase: any) {
  try {
    const vpsResponse = await makeVPSRequest('/health', 'GET');
    
    return new Response(
      JSON.stringify({
        success: vpsResponse.success,
        data: vpsResponse.data,
        error: vpsResponse.error
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED');
  console.log('[WhatsApp Server] Method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[WhatsApp Server] ✅ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.text();
    console.log('[WhatsApp Server] 📥 Raw request body:', requestBody);

    const body = JSON.parse(requestBody);
    console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(body, null, 2));

    const action = body.action;
    console.log('[WhatsApp Server] 🎯 Action:', action);

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[WhatsApp Server] ❌ No Authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      console.error('[WhatsApp Server] ❌ Invalid token:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[WhatsApp Server] 👤 User authenticated:', user.email);

    // Process actions
    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] ✨ CREATE INSTANCE');
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 📱 GET QR CODE ASYNC');
        return await getQRCodeAsync(supabase, body.instanceData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        return await deleteWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'check_server':
        console.log('[WhatsApp Server] 🔍 CHECK SERVER HEALTH');
        return await checkServerHealth(supabase);

      default:
        console.warn('[WhatsApp Server] ⚠️ UNKNOWN ACTION');
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[WhatsApp Server] 🔥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message, details: error }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
