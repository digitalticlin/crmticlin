
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Setup Auto Sync] 🔧 CONFIGURAÇÃO DE SINCRONIZAÇÃO AUTOMÁTICA');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === 'setup_cron') {
      console.log('[Setup Auto Sync] ⏰ Configurando cron job para sincronização automática...');

      // Configurar cron job para executar a cada 10 minutos
      const { data, error } = await supabase.rpc('cron_schedule', {
        job_name: 'auto_whatsapp_sync',
        schedule: '*/10 * * * *', // A cada 10 minutos
        command: `
          SELECT net.http_post(
            url := '${supabaseUrl}/functions/v1/auto_whatsapp_sync',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseServiceKey}"}'::jsonb,
            body := '{"auto_trigger": true}'::jsonb
          );
        `
      });

      if (error) {
        console.error('[Setup Auto Sync] ❌ Erro ao configurar cron:', error);
        throw error;
      }

      console.log('[Setup Auto Sync] ✅ Cron job configurado com sucesso');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sincronização automática configurada para executar a cada 10 minutos',
          cron_schedule: '*/10 * * * *'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'disable_cron') {
      console.log('[Setup Auto Sync] 🛑 Desabilitando cron job...');

      const { data, error } = await supabase.rpc('cron_unschedule', {
        job_name: 'auto_whatsapp_sync'
      });

      if (error) {
        console.error('[Setup Auto Sync] ❌ Erro ao desabilitar cron:', error);
        throw error;
      }

      console.log('[Setup Auto Sync] ✅ Cron job desabilitado');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sincronização automática desabilitada'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ação não reconhecida. Use "setup_cron" ou "disable_cron"'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('[Setup Auto Sync] ❌ Erro geral:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
