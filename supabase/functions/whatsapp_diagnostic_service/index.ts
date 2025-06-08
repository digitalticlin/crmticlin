
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'health_check') {
      return await healthCheck(supabase);
    }

    if (action === 'sync_instances') {
      return await syncInstances(supabase);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Diagnostic Service] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function healthCheck(supabase: any) {
  console.log('[Diagnostic Service] 🩺 Verificando saúde do sistema...');

  try {
    const checks = {
      database: false,
      webhook_server: false,
      webhook_endpoints: false
    };

    // 1. Testar conexão com banco
    try {
      const { data } = await supabase.from('whatsapp_instances').select('count').limit(1);
      checks.database = true;
      console.log('[Diagnostic Service] ✅ Banco conectado');
    } catch (dbError) {
      console.log('[Diagnostic Service] ❌ Erro no banco:', dbError.message);
    }

    // 2. Testar servidor webhook (porta 3002)
    try {
      const healthResponse = await fetch(`${WEBHOOK_SERVER_URL}/health`, { timeout: 10000 });
      if (healthResponse.ok) {
        checks.webhook_server = true;
        console.log('[Diagnostic Service] ✅ Webhook server conectado');
      }
    } catch (serverError) {
      console.log('[Diagnostic Service] ❌ Webhook server offline:', serverError.message);
    }

    // 3. Testar endpoints específicos
    try {
      const statusResponse = await fetch(`${WEBHOOK_SERVER_URL}/status`, { timeout: 5000 });
      const webhookResponse = await fetch(`${WEBHOOK_SERVER_URL}/webhook/global/status`, { timeout: 5000 });
      
      if (statusResponse.ok && webhookResponse.ok) {
        checks.webhook_endpoints = true;
        console.log('[Diagnostic Service] ✅ Endpoints webhook funcionando');
      }
    } catch (endpointError) {
      console.log('[Diagnostic Service] ❌ Endpoints com problema:', endpointError.message);
    }

    const allHealthy = Object.values(checks).every(check => check === true);

    return new Response(JSON.stringify({
      success: allHealthy,
      checks,
      server_port: 3002,
      summary: allHealthy ? 'Sistema totalmente funcional' : 'Alguns componentes com problemas',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Diagnostic Service] ❌ Erro no health check:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function syncInstances(supabase: any) {
  console.log('[Diagnostic Service] 🔄 Sincronizando instâncias...');

  try {
    // 1. Buscar instâncias ativas no webhook server
    const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instances`, { timeout: 10000 });
    
    if (!vpsResponse.ok) {
      throw new Error('Servidor webhook não responde');
    }

    const vpsData = await vpsResponse.json();
    const vpsInstances = vpsData.instances || [];

    console.log(`[Diagnostic Service] 📡 Encontradas ${vpsInstances.length} instâncias na VPS`);

    // 2. Buscar instâncias no banco
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error(`Erro no banco: ${dbError.message}`);
    }

    console.log(`[Diagnostic Service] 💾 Encontradas ${dbInstances?.length || 0} instâncias no banco`);

    let syncedCount = 0;

    // 3. Sincronizar status das instâncias
    for (const vpsInstance of vpsInstances) {
      const dbInstance = dbInstances?.find(db => db.vps_instance_id === vpsInstance.instanceId);
      
      if (dbInstance && dbInstance.connection_status !== vpsInstance.status) {
        await supabase
          .from('whatsapp_instances')
          .update({ 
            connection_status: vpsInstance.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', dbInstance.id);
        
        syncedCount++;
        console.log(`[Diagnostic Service] 🔄 Sincronizada: ${vpsInstance.instanceId}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      syncedCount,
      vps_instances: vpsInstances.length,
      db_instances: dbInstances?.length || 0,
      server_port: 3002
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Diagnostic Service] ❌ Erro na sincronização:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      syncedCount: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
