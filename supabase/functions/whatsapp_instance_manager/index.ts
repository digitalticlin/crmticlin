
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Apenas porta 3002
const VPS_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, instanceName, instanceId } = await req.json();

    if (action === 'create_instance') {
      return await createInstanceCorrected(supabase, instanceName);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[Instance Manager] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceCorrected(supabase: any, instanceName: string) {
  console.log(`[Instance Manager] 🚀 CORREÇÃO: Criando instância ${instanceName} na VPS porta 3002`);

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // CORREÇÃO: Usar porta 3002 e endpoint corrigido
    const vpsResponse = await fetch(`${VPS_SERVER_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
      },
      body: JSON.stringify({
        instanceId: instanceName,
        sessionName: instanceName,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      throw new Error(`VPS responded with ${vpsResponse.status}: ${errorText}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[Instance Manager] 📡 VPS response:`, vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    // Salvar no banco
    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: instanceName,
        connection_type: 'web',
        server_url: VPS_SERVER_URL,
        vps_instance_id: vpsData.instanceId || instanceName,
        web_status: 'initializing',
        connection_status: 'vps_pending',
        created_by_user_id: user.id,
        company_id: null
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Instance Manager] ❌ Erro no banco:', dbError);
      throw new Error('Erro ao salvar instância no banco');
    }

    console.log(`[Instance Manager] ✅ Instância criada com sucesso:`, newInstance.id);

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na criação:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string) {
  console.log(`[Instance Manager] 🗑️ CORREÇÃO: Deletando instância ${instanceId}`);
  
  try {
    // Buscar a instância no banco
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      throw new Error('Instância não encontrada');
    }

    // CORREÇÃO: Usar porta 3002 e enviar para VPS
    if (instance.vps_instance_id) {
      try {
        const vpsResponse = await fetch(`${VPS_SERVER_URL}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
          },
          signal: AbortSignal.timeout(15000)
        });

        // Log mas não falhar se a VPS não conseguir deletar (limpar banco de qualquer forma)
        if (!vpsResponse.ok) {
          console.error(`[Instance Manager] ⚠️ VPS não deletou instância: ${vpsResponse.status}`);
        } else {
          console.log(`[Instance Manager] ✅ VPS deletou instância com sucesso`);
        }
      } catch (vpsError) {
        console.error('[Instance Manager] ⚠️ Erro ao comunicar com VPS:', vpsError);
        // Continuar mesmo com erro VPS
      }
    }

    // CORREÇÃO: Sempre deletar do banco, mesmo com erro na VPS
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância do banco: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ Erro na deleção:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
