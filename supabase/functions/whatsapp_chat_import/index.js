import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { authenticateUser } from './services/authService.ts';
import { handleImportData } from './handlers/importDataHandler.ts';
import { handleImportGradual } from './handlers/importGradualHandler.ts';
import { handleImportStatus } from './handlers/importStatusHandler.ts';
import { handleImportPuppeteer } from './handlers/importPuppeteerHandler.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { action } = body;
    console.log(`[Chat Import] 🎯 Action: ${action}`);
    // Permitir webhook_progress sem autenticação
    if (action === 'webhook_progress') {
      const result = await handleImportPuppeteer(supabase, null, body);
      const { status = 200, ...responseData } = result;
      return new Response(JSON.stringify(responseData), {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Authenticate user para as demais actions
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: authResult.error
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { user } = authResult;
    let result;
    switch(action){
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
      default:
        result = {
          success: false,
          error: `Unrecognized action: ${action}`,
          status: 400
        };
    }
    const { status = 200, ...responseData } = result;
    return new Response(JSON.stringify(responseData), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[Chat Import] ❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 