
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO ATUALIZADA: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_CONFIG = {
  url: 'http://31.97.24.222:3002',
  port: 3002,
  webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Auto Deploy] 🚀 Verificando status do servidor webhook...');

    const deployStatus = {
      webhook_server: {
        running: false,
        port: WEBHOOK_SERVER_CONFIG.port,
        url: WEBHOOK_SERVER_CONFIG.url
      },
      health_check: false,
      webhook_configured: false,
      endpoints_active: false
    };

    // 1. Verificar se servidor está rodando
    try {
      const healthResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.url}/health`, { timeout: 10000 });
      if (healthResponse.ok) {
        deployStatus.webhook_server.running = true;
        deployStatus.health_check = true;
        console.log('[VPS Auto Deploy] ✅ Servidor webhook já está rodando');
      }
    } catch (error) {
      console.log('[VPS Auto Deploy] ❌ Servidor webhook não está respondendo');
    }

    // 2. Verificar configuração do webhook
    try {
      const webhookResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.url}/webhook/global/status`, { timeout: 5000 });
      if (webhookResponse.ok) {
        deployStatus.webhook_configured = true;
        console.log('[VPS Auto Deploy] ✅ Webhook configurado');
      }
    } catch (error) {
      console.log('[VPS Auto Deploy] ⚠️ Webhook não configurado');
    }

    // 3. Verificar endpoints
    try {
      const instancesResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.url}/instances`, { timeout: 5000 });
      const sendResponse = await fetch(`${WEBHOOK_SERVER_CONFIG.url}/send`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
        timeout: 5000
      });
      
      if (instancesResponse.ok) {
        deployStatus.endpoints_active = true;
        console.log('[VPS Auto Deploy] ✅ Endpoints ativos');
      }
    } catch (error) {
      console.log('[VPS Auto Deploy] ⚠️ Alguns endpoints não respondem');
    }

    const isFullyDeployed = 
      deployStatus.webhook_server.running && 
      deployStatus.health_check && 
      deployStatus.webhook_configured && 
      deployStatus.endpoints_active;

    const recommendations = [];
    if (!deployStatus.webhook_server.running) {
      recommendations.push('Servidor webhook precisa ser iniciado na porta 3002');
    }
    if (!deployStatus.webhook_configured) {
      recommendations.push('Configurar webhook para receber eventos automáticos');
    }
    if (!deployStatus.endpoints_active) {
      recommendations.push('Verificar se todos os endpoints estão ativos');
    }

    console.log(`[VPS Auto Deploy] 📊 Status: ${isFullyDeployed ? 'Totalmente implantado' : 'Necessita ajustes'}`);

    return new Response(JSON.stringify({
      success: isFullyDeployed,
      status: isFullyDeployed ? 'deployed' : 'needs_attention',
      deployStatus,
      recommendations,
      server_info: WEBHOOK_SERVER_CONFIG,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[VPS Auto Deploy] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      server_info: WEBHOOK_SERVER_CONFIG
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
