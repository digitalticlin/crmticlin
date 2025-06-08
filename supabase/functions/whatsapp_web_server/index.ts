
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './config.ts';
import { syncAllInstances } from './instanceSyncDedicatedService.ts';

console.log(`[WhatsApp Server] 🚀 SERVIDOR DE SINCRONIZAÇÃO - Apenas sync global`);

serve(async (req) => {
  console.log(`[WhatsApp Server] 🚀 REQUEST: ${req.method}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log(`[WhatsApp Server] 📥 Raw body: ${rawBody}`);

    let requestBody: any = {};
    if (rawBody) {
      try {
        requestBody = JSON.parse(rawBody);
      } catch (e) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { action } = requestBody;
    console.log(`[WhatsApp Server] 🎯 Action: ${action}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle actions - APENAS SYNC GLOBAL
    switch (action) {
      case 'sync_all_instances':
        console.log(`[WhatsApp Server] 🌐 SINCRONIZAÇÃO GLOBAL INICIADA`);
        return await syncAllInstances(supabase);

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Action não suportada: ${action}. Use whatsapp_instance_manager para gerenciar instâncias.`,
            available_actions: ['sync_all_instances']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ Error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
