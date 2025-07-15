
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1',
  timeout: 30000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token inválido ou expirado'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, instanceId, phone, message } = await req.json();

    if (action === 'send_message') {
      try {
        console.log('[Messaging Service] 📤 Enviando mensagem via VPS:', { instanceId, phone });
        
        const response = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_CONFIG.authToken}`
          },
          body: JSON.stringify({
            instanceId,
            phone,
            message
          })
        });

        if (!response.ok) {
          throw new Error(`VPS HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        return new Response(JSON.stringify({
          success: true,
          data,
          method: 'EDGE_FUNCTION_MESSAGING'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('[Messaging Service] ❌ Erro ao enviar mensagem:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: error.message || 'Erro ao enviar mensagem'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
