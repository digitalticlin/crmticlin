
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Auto WhatsApp Sync] 🤖 SINCRONIZAÇÃO AUTOMÁTICA GLOBAL INICIADA');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Auto WhatsApp Sync] 📞 Chamando sincronização GLOBAL completa...');

    // **CORREÇÃO**: Chamar a ação sync_all_instances (sincronização completa)
    const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
      body: {
        action: 'sync_all_instances' // **NOVA AÇÃO**: Sincronização global
      },
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`
      }
    });

    if (error) {
      console.error('[Auto WhatsApp Sync] ❌ Erro na invocação:', error);
      throw error;
    }

    console.log('[Auto WhatsApp Sync] ✅ Sincronização global concluída:', data);

    // Estatísticas detalhadas
    const summary = data?.summary || {};
    const results = data?.results || {};

    console.log(`[Auto WhatsApp Sync] 📊 Resultados:`);
    console.log(`[Auto WhatsApp Sync] - VPS: ${summary.vps_instances || 0} instâncias`);
    console.log(`[Auto WhatsApp Sync] - Supabase: ${summary.supabase_instances || 0} instâncias`);
    console.log(`[Auto WhatsApp Sync] - Órfãs adicionadas: ${results.added || 0}`);
    console.log(`[Auto WhatsApp Sync] - Status atualizados: ${results.updated || 0}`);
    console.log(`[Auto WhatsApp Sync] - Vínculos preservados: ${results.preserved_links || 0}`);
    console.log(`[Auto WhatsApp Sync] - Erros: ${results.errors?.length || 0}`);

    // Verificar órfãs restantes
    const { data: orphanCount } = await supabase.rpc('get_orphan_instances_count');
    
    console.log(`[Auto WhatsApp Sync] 🏠 Instâncias órfãs (created_by_user_id: NULL): ${orphanCount || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização automática global executada com sucesso',
        data: data,
        summary: {
          sync_type: 'global_complete',
          vps_instances: summary.vps_instances || 0,
          orphans_imported: results.added || 0,
          status_updated: results.updated || 0,
          links_preserved: results.preserved_links || 0,
          orphan_instances_remaining: orphanCount || 0,
          errors_count: results.errors?.length || 0
        },
        timestamp: new Date().toISOString(),
        auto_sync: true,
        execution_time_ms: data?.execution_time_ms || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Auto WhatsApp Sync] ❌ Erro na sincronização automática global:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        auto_sync: true,
        sync_type: 'global_complete'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
