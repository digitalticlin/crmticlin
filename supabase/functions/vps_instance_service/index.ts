
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

  const executionId = `vps_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`🔧 VPS SERVICE INICIADO - ${executionId}`);

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
    const { action, instanceId, config } = body;

    console.log(`[VPS Service] ${action} - Usuario: ${user.email}`);

    switch (action) {
      case 'create_instance':
        return await createVPSInstance(instanceId, config);
      
      case 'delete_instance':
        return await deleteVPSInstance(instanceId);
      
      case 'get_qr_code':
        return await getVPSQRCode(instanceId);
      
      case 'health_check':
        return await checkVPSHealth();
      
      default:
        throw new Error(`Action não suportada: ${action}`);
    }

  } catch (error: any) {
    console.error(`❌ Erro no VPS Service:`, error.message);
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

async function createVPSInstance(instanceId: string, config: any = {}) {
  try {
    console.log(`[VPS] Criando instância via API oficial: ${instanceId}`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
        lightweight: true,
        skipPuppeteer: true,
        ...config
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[VPS] ✅ Instância criada com sucesso`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[VPS] ❌ Erro na criação:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.name === 'AbortError' ? 'VPS_TIMEOUT_15S' : error.message,
        source: 'vps_api_official'
      }),
      {
        status: 200, // Não é erro HTTP, é fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function deleteVPSInstance(instanceId: string) {
  try {
    console.log(`[VPS] Deletando instância via API oficial: ${instanceId}`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    await fetch(`${vpsUrl}/instance/${instanceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${vpsToken}`,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`[VPS] ✅ Instância deletada`);

    return new Response(
      JSON.stringify({
        success: true,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.log(`[VPS] ⚠️ Erro ao deletar (não crítico): ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: true, // Não crítico para deleção
        warning: error.message,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function getVPSQRCode(instanceId: string) {
  try {
    console.log(`[VPS] Obtendo QR Code via API oficial: ${instanceId}`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${vpsUrl}/instance/${instanceId}/qr`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vpsToken}`,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VPS QR HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: !!data.qrCode,
        qrCode: data.qrCode,
        waiting: !data.qrCode,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[VPS] ❌ Erro QR Code:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        waiting: true,
        error: error.message,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function checkVPSHealth() {
  try {
    console.log(`[VPS] Health check via API oficial`);
    
    const vpsUrl = Deno.env.get('VPS_SERVER_URL') || 'http://31.97.24.222:3002';
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${vpsUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vpsToken}`,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: response.ok,
        responseTime,
        status: response.status,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`[VPS] ❌ Health check falhou:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        source: 'vps_api_official'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
