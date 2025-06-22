
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  console.log(`🚀 [${executionId}] ESTRUTURA MODULAR - EDGE FUNCTION INICIADA`);
  
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const body = await req.json();
    const { action, instanceName, instanceId } = body;

    console.log(`[${executionId}] Processando ação: ${action} para usuário: ${user.email}`);

    switch (action) {
      case 'create_instance':
        return await createInstanceModular(supabase, user, instanceName, executionId);
      
      case 'get_qr_code':
        return await getQRCodeModular(supabase, user, instanceId, executionId);
      
      case 'health_check':
        return await healthCheckModular(executionId);
      
      default:
        throw new Error(`Action não suportada: ${action}`);
    }

  } catch (error: any) {
    console.error(`❌ [${executionId}] Erro na Edge Function:`, error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        executionId 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createInstanceModular(supabase: any, user: any, instanceName: string, executionId: string) {
  try {
    console.log(`[${executionId}] 🚀 Criando instância modular: ${instanceName}`);
    
    // Gerar nome inteligente
    const intelligentName = await generateIntelligentName(supabase, user, instanceName);
    console.log(`[${executionId}] 🎯 Nome inteligente: ${intelligentName}`);

    // Tentar VPS
    const vpsResult = await attemptVPSCreation(intelligentName, executionId);
    
    if (vpsResult.success) {
      console.log(`[${executionId}] ✅ VPS Success`);
      // Salvar no banco com dados VPS
      const instance = await saveInstanceToDatabase(supabase, user, intelligentName, 'connected', vpsResult.data);
      return createSuccessResponse(instance, vpsResult, intelligentName, user.email, false, executionId);
    } else {
      console.log(`[${executionId}] 🚨 VPS Fallback: ${vpsResult.error}`);
      // Criar instância apenas no banco (fallback)
      const instance = await saveInstanceToDatabase(supabase, user, intelligentName, 'database_only');
      return createSuccessResponse(instance, vpsResult, intelligentName, user.email, true, executionId);
    }

  } catch (error: any) {
    console.error(`[${executionId}] ❌ Erro na criação:`, error.message);
    throw error;
  }
}

async function getQRCodeModular(supabase: any, user: any, instanceId: string, executionId: string) {
  try {
    console.log(`[${executionId}] 📱 Obtendo QR Code para: ${instanceId}`);
    
    // Buscar instância do usuário
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (error || !instance) {
      throw new Error('Instância não encontrada');
    }

    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${vpsUrl}/instance/${instance.vps_instance_id}/qr`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vpsToken}`,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: data.success || false,
        qrCode: data.qrCode || null,
        waiting: !data.success,
        error: data.error || null,
        executionId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[${executionId}] ❌ Erro ao obter QR:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        waiting: false,
        error: error.message,
        executionId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function healthCheckModular(executionId: string) {
  try {
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${vpsUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok;
    
    return new Response(
      JSON.stringify({
        success: isHealthy,
        message: isHealthy ? 'VPS online' : 'VPS offline',
        executionId
      }),
      {
        status: isHealthy ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Health check falhou: ${error.message}`,
        executionId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function attemptVPSCreation(instanceId: string, executionId: string) {
  try {
    console.log(`[${executionId}] 🌐 Criando na VPS: ${instanceId}`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${vpsUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      },
      body: JSON.stringify({
        instanceId,
        sessionName: instanceId,
        webhookUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[${executionId}] ✅ VPS criada com sucesso`);
    
    return { success: true, data };

  } catch (error: any) {
    console.log(`[${executionId}] ❌ VPS falhou: ${error.message}`);
    return { 
      success: false, 
      error: `VPS_ERROR: ${error.message}`
    };
  }
}

async function generateIntelligentName(supabase: any, user: any, baseInstanceName?: string): Promise<string> {
  try {
    const baseName = baseInstanceName || user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    
    const { data: existingInstances } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('created_by_user_id', user.id)
      .eq('connection_type', 'web');

    const existingNames = existingInstances?.map((i: any) => i.instance_name) || [];
    
    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    let counter = 1;
    let candidateName = `${baseName}${counter}`;
    while (existingNames.includes(candidateName)) {
      counter++;
      candidateName = `${baseName}${counter}`;
    }

    return candidateName;
  } catch (error) {
    return `whatsapp_${Date.now()}`;
  }
}

async function saveInstanceToDatabase(supabase: any, user: any, instanceName: string, status: string, vpsData?: any) {
  const instanceData = {
    instance_name: instanceName,
    connection_type: 'web',
    server_url: 'http://31.97.24.222:3002',
    vps_instance_id: instanceName,
    web_status: status === 'connected' ? 'connected' : 'fallback_created',
    connection_status: status,
    created_by_user_id: user.id,
    qr_code: vpsData?.qrCode || null
  };

  const { data: instance, error } = await supabase
    .from('whatsapp_instances')
    .insert(instanceData)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao salvar no banco: ${error.message}`);
  }

  return instance;
}

function createSuccessResponse(instance: any, vpsResult: any, intelligentName: string, userEmail: string, fallbackUsed: boolean, executionId: string) {
  return new Response(
    JSON.stringify({
      success: true,
      instance,
      vps_response: {
        success: vpsResult.success,
        instanceId: intelligentName,
        fallback: fallbackUsed,
        vpsError: vpsResult.error || null,
        mode: fallbackUsed ? 'database_only' : 'vps_connected'
      },
      user_id: instance.created_by_user_id,
      intelligent_name: intelligentName,
      user_email: userEmail,
      vps_success: vpsResult.success,
      fallback_used: fallbackUsed,
      mode: fallbackUsed ? 'database_only' : 'vps_connected',
      message: fallbackUsed ? 'Instância criada em modo fallback' : 'Instância criada com sucesso',
      executionId
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
