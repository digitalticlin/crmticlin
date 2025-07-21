
// ========================================
// TESTE AUTOMATIZADO DA WEBHOOK
// ========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função de teste para validar o webhook WhatsApp
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    console.log(`[Test] 🧪 WEBHOOK TEST INICIADO [${testId}]`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente Supabase com SERVICE ROLE
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      }
    });

    // Teste 1: Conectividade do banco
    console.log(`[Test] 📊 Testando conectividade do banco...`);
    const { data: connectionTest, error: connectionError } = await supabase
      .from('whatsapp_instances')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      throw new Error(`Falha na conectividade: ${connectionError.message}`);
    }

    // Teste 2: Função save_whatsapp_message_service_role
    console.log(`[Test] 🔧 Testando função save_whatsapp_message_service_role...`);
    const { data: functionTest, error: functionError } = await supabase.rpc('save_whatsapp_message_service_role', {
      p_vps_instance_id: 'test_instance',
      p_phone: '5511999999999',
      p_message_text: 'Mensagem de teste',
      p_from_me: false,
      p_media_type: 'text',
      p_media_url: null,
      p_external_message_id: `test_msg_${testId}`,
      p_contact_name: 'Teste Contato'
    });

    const testResults = {
      test_id: testId,
      timestamp: new Date().toISOString(),
      connectivity: {
        success: !connectionError,
        error: connectionError?.message
      },
      function_test: {
        success: !functionError && functionTest?.success,
        error: functionError?.message || (!functionTest?.success ? functionTest?.error : null),
        result: functionTest
      },
      environment: {
        supabase_url: supabaseUrl ? 'OK' : 'MISSING',
        service_key: supabaseServiceKey ? 'OK' : 'MISSING'
      }
    };

    console.log(`[Test] ✅ Teste concluído [${testId}]:`, testResults);

    return new Response(JSON.stringify({
      success: true,
      test_results: testResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`[Test] ❌ Erro no teste [${testId}]:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      test_id: testId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
