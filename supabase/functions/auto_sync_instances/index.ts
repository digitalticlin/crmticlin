
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Auto Sync] 🤖 SINCRONIZAÇÃO AUTOMÁTICA INICIADA - VERSÃO CORRIGIDA');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Auto Sync] 📞 Chamando função de sincronização corrigida...');

    // Chamar a função de sincronização principal com autenticação de service role
    const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
      body: {
        action: 'sync_instances'
      },
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`
      }
    });

    if (error) {
      console.error('[Auto Sync] ❌ Erro na invocação:', error);
      throw error;
    }

    console.log('[Auto Sync] ✅ Sincronização automática concluída com sucesso:', data);

    // Log do resultado da sincronização com mais detalhes
    const logResult = {
      function_name: 'auto_sync_instances',
      status: 'success',
      result: {
        data: data,
        auto_sync: true,
        summary: {
          updated: data?.data?.updatedCount || 0,
          inserted: data?.data?.createdCount || 0,
          deleted: 0,
          errors: 0
        },
        total_evolution_instances: data?.data?.vpsInstancesCount || 0
      },
      execution_time: '00:00:05'
    };

    await supabase
      .from('sync_logs')
      .insert(logResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização automática executada com sucesso',
        data: data,
        timestamp: new Date().toISOString(),
        auto_sync: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Auto Sync] ❌ Erro na sincronização automática:', error);

    // Log do erro com mais detalhes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'auto_sync_instances',
        status: 'error',
        error_message: error.message,
        execution_time: '00:00:05',
        result: {
          auto_sync: true,
          error_details: {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3)
          }
        }
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        auto_sync: true
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
