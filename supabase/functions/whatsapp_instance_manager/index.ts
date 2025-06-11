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
  
  try {
    console.log(`🚀 EDGE FUNCTION NÍVEL 8 - SEM PUPPETEER INICIOU`);

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

    console.log(`[${action}] Processando NÍVEL 8 para usuário: ${user.email}`);

    switch (action) {
      case 'create_instance':
        return await createInstanceViaBaileys(supabase, user, instanceName);
      
      case 'delete_instance_corrected':
        return await deleteInstanceViaBaileys(supabase, user, instanceId);
      
      case 'get_qr_code':
        return await getQRCodeViaBaileys(supabase, user, instanceId);
      
      case 'health_check':
        return await healthCheckViaBaileys();
      
      default:
        throw new Error(`Action não suportada: ${action}`);
    }

  } catch (error: any) {
    console.error(`❌ Erro na Edge Function NÍVEL 8:`, error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createInstanceViaBaileys(supabase: any, user: any, instanceName: string) {
  try {
    // Gerar nome inteligente
    const intelligentName = await generateIntelligentName(supabase, user, instanceName);
    console.log(`[CREATE BAILEYS] Nome gerado: ${intelligentName}`);

    // Tentar VPS com Baileys (sem Puppeteer)
    const vpsResult = await attemptVPSCreationWithBaileys(intelligentName);
    
    if (vpsResult.success) {
      console.log(`[CREATE BAILEYS] ✅ VPS Success com Baileys`);
      // Salvar no banco com dados VPS
      const instance = await saveInstanceToDatabase(supabase, user, intelligentName, 'connected', vpsResult.data);
      return createSuccessResponse(instance, vpsResult, intelligentName, user.email, false);
    } else {
      console.log(`[CREATE BAILEYS] 🚨 VPS Fallback: ${vpsResult.error}`);
      // Criar instância apenas no banco (fallback)
      const instance = await saveInstanceToDatabase(supabase, user, intelligentName, 'database_only');
      return createSuccessResponse(instance, vpsResult, intelligentName, user.email, true);
    }

  } catch (error: any) {
    console.error(`[CREATE BAILEYS] ❌ Erro:`, error.message);
    throw error;
  }
}

async function deleteInstanceViaBaileys(supabase: any, user: any, instanceId: string) {
  try {
    // Buscar instância
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (error || !instance) {
      throw new Error('Instância não encontrada');
    }

    console.log(`[DELETE BAILEYS] Removendo: ${instance.instance_name}`);

    // Deletar da VPS usando endpoint correto
    if (instance.vps_instance_id) {
      await attemptVPSDeletionWithBaileys(instance.vps_instance_id);
    }

    // Deletar do banco
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
    }

    console.log(`[DELETE BAILEYS] ✅ Sucesso`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[DELETE BAILEYS] ❌ Erro:`, error.message);
    throw error;
  }
}

async function getQRCodeViaBaileys(supabase: any, user: any, instanceId: string) {
  try {
    console.log(`[QR BAILEYS] Obtendo QR Code para: ${instanceId}`);
    
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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Aumentado para 30s

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
        error: data.error || null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[QR BAILEYS] ❌ Erro:`, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        waiting: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function healthCheckViaBaileys() {
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
        message: isHealthy ? 'VPS online com Baileys' : 'VPS offline'
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
        error: `Health check falhou: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function attemptVPSCreationWithBaileys(instanceId: string) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`[VPS BAILEYS] Criando com Baileys: ${instanceId}...`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Aumentado para 30s

    const response = await fetch(`${vpsUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      },
      body: JSON.stringify({
        instanceId,
        sessionName: instanceId,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
        useBaileys: true, // NOVA FLAG PARA USAR BAILEYS
        skipPuppeteer: true // DESATIVAR PUPPETEER
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[VPS BAILEYS] ✅ Criado com sucesso usando Baileys`);
    
    return { success: true, data };

  } catch (error: any) {
    console.log(`[VPS BAILEYS] ❌ Falhou: ${error.message}`);
    return { 
      success: false, 
      error: `VPS_BAILEYS_ERROR: ${error.message}. Criando instância em modo fallback.`
    };
  }
}

async function attemptVPSDeletionWithBaileys(instanceId: string) {
  try {
    console.log(`[VPS BAILEYS] Deletando: ${instanceId}...`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Usar endpoint correto para deleção
    await fetch(`${vpsUrl}/instance/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      },
      body: JSON.stringify({
        instanceId: instanceId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`[VPS BAILEYS] ✅ Deletado`);

  } catch (error: any) {
    console.log(`[VPS BAILEYS] ⚠️ Erro ao deletar (não crítico): ${error.message}`);
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
    company_id: null,
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

function createSuccessResponse(instance: any, vpsResult: any, intelligentName: string, userEmail: string, fallbackUsed: boolean) {
  return new Response(
    JSON.stringify({
      success: true,
      instance,
      vps_response: {
        success: vpsResult.success,
        instanceId: intelligentName,
        fallback: fallbackUsed,
        vpsError: vpsResult.error || null,
        mode: fallbackUsed ? 'database_only' : 'baileys_connected_direct'
      },
      user_id: instance.created_by_user_id,
      intelligent_name: intelligentName,
      user_email: userEmail,
      vps_success: vpsResult.success,
      fallback_used: fallbackUsed,
      mode: fallbackUsed ? 'database_only' : 'baileys_connected_direct',
      message: fallbackUsed ? 'Instância criada em modo fallback (VPS lenta/indisponível)' : 'Instância criada com sucesso via Baileys (sem Puppeteer)'
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
