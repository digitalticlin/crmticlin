import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[Forward Edge] 🚀 Iniciando processamento de encaminhamento');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const {
      messageId,           // ID da mensagem original
      targetContactId,     // ID do lead destino
      instanceId           // ID da instância WhatsApp
    } = await req.json();

    console.log('[Forward Edge] 📤 Parâmetros:', {
      messageId,
      targetContactId,
      instanceId,
      userId: user.id
    });

    // Validação
    if (!messageId || !targetContactId || !instanceId) {
      throw new Error('Parâmetros inválidos');
    }

    // Chamar RPC que duplica a mensagem
    const { data: result, error: rpcError } = await supabase.rpc('forward_message_to_contact', {
      p_message_id: messageId,
      p_target_lead_id: targetContactId,
      p_instance_id: instanceId,
      p_user_id: user.id
    });

    if (rpcError) {
      console.error('[Forward Edge] ❌ Erro na RPC:', rpcError);
      throw rpcError;
    }

    console.log('[Forward Edge] ✅ Sucesso:', result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Forward Edge] ❌ Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
