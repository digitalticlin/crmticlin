
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Auto Sync] 🤖 SINCRONIZAÇÃO AUTOMÁTICA INICIADA');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Auto Sync] 📞 Chamando função de sincronização...');

    // Chamar a função de sincronização principal
    const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
      body: {
        action: 'sync_instances'
      }
    });

    if (error) {
      throw error;
    }

    console.log('[Auto Sync] ✅ Sincronização automática concluída:', data);

    // Log do resultado da sincronização
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'auto_sync_instances',
        status: 'success',
        result: data,
        execution_time: '00:00:05' // Aproximado
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização automática executada com sucesso',
        data: data,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Auto Sync] ❌ Erro na sincronização automática:', error);

    // Log do erro
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'auto_sync_instances',
        status: 'error',
        error_message: error.message,
        execution_time: '00:00:05'
      });

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
