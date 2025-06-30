// Supabase Edge Function para importação de chats do WhatsApp
// Versão com PROXY CORS + CREATE INSTANCE - FORÇA REDEPLOY v3.2

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { authenticateUser } from './services/authService.ts';
import { handleImportData } from './handlers/importDataHandler.ts';
import { handleImportGradual } from './handlers/importGradualHandler.ts';
import { handleImportStatus } from './handlers/importStatusHandler.ts';
import { handleImportPuppeteer } from './handlers/importPuppeteerHandler.ts';


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    console.log(`[Chat Import] 🎯 Action: ${action}`);

    // Authenticate user for most actions (except webhooks)
    let authResult;
    let user = null;
    
    if (!['webhook_progress', 'puppeteer_webhook', 'auto_import_trigger'].includes(action)) {
      authResult = await authenticateUser(req, supabase);
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: authResult.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      user = authResult.user;
    }

    let result;
    switch (action) {
      case 'import_data':
        result = await handleImportData(supabase, user, body);
        break;
      
      case 'get_import_status':
        result = await handleImportStatus(supabase, user, body);
        break;
      
      case 'import_chats_gradual':
        result = await handleImportGradual(supabase, body);
        break;
      
      case 'import_via_puppeteer':
        result = await handleImportPuppeteer(supabase, user, body);
        break;
      
      case 'poll_qr_status':
        result = await handleImportPuppeteer(supabase, user, { ...body, action: 'poll_qr_status' });
        break;
      
      case 'start_import':
        result = await handleImportPuppeteer(supabase, user, { ...body, action: 'start_import' });
        break;
      
      case 'webhook_progress':
        // Webhook recebido da VPS durante importação Puppeteer
        console.log('[Chat Import] 🔔 Webhook direto da VPS recebido');
        result = await handleImportPuppeteer(supabase, null, { ...body, action: 'webhook_progress' });
        break;
      
      case 'puppeteer_webhook':
        // 🆕 WEBHOOK ESPECÍFICO PARA VPS PUPPETEER (sem autenticação)
        console.log('[Chat Import] 🎭 Webhook específico Puppeteer recebido');
        result = await handleImportPuppeteer(supabase, null, { ...body, action: 'webhook_progress' });
        break;
      
      case 'auto_import_trigger':
        // Trigger automático para importação gradual
        result = await handleAutoImportTrigger(supabase, body);
        break;
      
      default:
        result = {
          success: false,
          error: `Unrecognized action: ${action}`,
          status: 400
        };
    }

    const { status = 200, ...responseData } = result;
    return new Response(
      JSON.stringify(responseData),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Chat Import] ❌ Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 🆕 Handler para trigger automático de importação
async function handleAutoImportTrigger(supabase: any, body: any) {
  const { instanceId, vpsInstanceId, delay = 60000 } = body;
  
  console.log(`[Auto Import] 🚀 Trigger automático recebido:`, { instanceId, vpsInstanceId, delay });
  
  try {
    // Aguardar delay para não sobrecarregar
    if (delay > 0) {
      console.log(`[Auto Import] ⏰ Aguardando ${delay}ms antes de iniciar...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Executar importação gradual
    const result = await handleImportGradual(supabase, { instanceId, vpsInstanceId });
    
    console.log(`[Auto Import] ${result.success ? '✅' : '❌'} Importação automática concluída:`, {
      success: result.success,
      contactsImported: result.contactsImported,
      messagesImported: result.messagesImported
    });
    
    return {
      success: true,
      message: 'Auto import trigger executed',
      result,
      status: 200
    };
    
  } catch (error: any) {
    console.error(`[Auto Import] ❌ Erro no trigger automático:`, error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}
