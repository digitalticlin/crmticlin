
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Auto WhatsApp Sync] 🤖 SINCRONIZAÇÃO AUTOMÁTICA INICIADA');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Auto WhatsApp Sync] 📞 Chamando função de sincronização...');

    // Chamar a função de sincronização principal
    const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
      body: {
        action: 'sync_instances'
      },
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`
      }
    });

    if (error) {
      console.error('[Auto WhatsApp Sync] ❌ Erro na invocação:', error);
      throw error;
    }

    console.log('[Auto WhatsApp Sync] ✅ Sincronização automática concluída:', data);

    // Verificar quantas instâncias órfãs existem
    const { data: orphanCount } = await supabase.rpc('get_orphan_instances_count');
    
    console.log(`[Auto WhatsApp Sync] 📊 Instâncias órfãs encontradas: ${orphanCount || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sincronização automática executada com sucesso',
        data: data,
        orphan_instances: orphanCount || 0,
        timestamp: new Date().toISOString(),
        auto_sync: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Auto WhatsApp Sync] ❌ Erro na sincronização automática:', error);

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
