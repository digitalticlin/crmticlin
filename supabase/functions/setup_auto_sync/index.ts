
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Setup Auto Sync] 🔧 CONFIGURAÇÃO DE SINCRONIZAÇÃO AUTOMÁTICA CORRIGIDA');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === 'setup_cron') {
      console.log('[Setup Auto Sync] ⏰ Configurando cron job para sincronização automática...');

      // Criar comando SQL para o cron job
      const cronSQL = `
        SELECT cron.schedule(
          'auto_whatsapp_sync_corrected',
          '*/5 * * * *',
          $$
          SELECT net.http_post(
            url := '${supabaseUrl}/functions/v1/auto_sync_instances',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseServiceKey}"}'::jsonb,
            body := '{"action": "sync_all_instances", "auto_trigger": true, "cron_execution": true}'::jsonb
          );
          $$
        );
      `;

      console.log('[Setup Auto Sync] 📝 Executando SQL para cron job:', cronSQL);

      // Executar via RPC
      const { data, error } = await supabase.rpc('exec', { sql: cronSQL });

      if (error) {
        console.error('[Setup Auto Sync] ❌ Erro ao configurar cron:', error);
        throw error;
      }

      console.log('[Setup Auto Sync] ✅ Cron job configurado com sucesso');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sincronização automática configurada para executar a cada 5 minutos',
          cron_schedule: '*/5 * * * *',
          vps_auth: 'enabled',
          enhanced_data_capture: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'test_sync') {
      console.log('[Setup Auto Sync] 🧪 Testando sincronização manual...');

      const { data, error } = await supabase.functions.invoke('auto_sync_instances', {
        body: {
          action: 'sync_all_instances',
          manual_test: true
        }
      });

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          test_result: data,
          message: 'Teste de sincronização executado com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Ação não reconhecida. Use "setup_cron" ou "test_sync"'
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
