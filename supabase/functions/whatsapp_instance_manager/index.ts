import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO EXATA DO SCRIPT QUE FUNCIONA
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

    // AUTENTICAÇÃO JWT CORRIGIDA
    const authHeader = req.headers.get('Authorization');
    let currentUser = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      console.log('[Instance Manager] 🔐 HÍBRIDO: Autenticando com token JWT...');
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError) {
          console.log('[Instance Manager] ⚠️ Erro JWT:', userError.message);
        } else if (user) {
          currentUser = user;
          console.log('[Instance Manager] ✅ HÍBRIDO: Usuário autenticado:', user.email);
        }
      } catch (authError) {
        console.log('[Instance Manager] ⚠️ Falha na autenticação JWT:', authError.message);
      }
    }

    if (!currentUser) {
      throw new Error('Usuário não autenticado - token obrigatório');
    }

    const { action, instanceName, instanceId } = await req.json();
    console.log('[Instance Manager] 📥 HÍBRIDO: Ação recebida:', action, 'para usuário:', currentUser?.email);

    if (action === 'create_instance') {
      return await createInstanceHybrid(supabase, instanceName, currentUser);
    }

    if (action === 'delete_instance_corrected') {
      return await deleteInstanceCorrected(supabase, instanceId, currentUser);
    }

    throw new Error('Ação não reconhecida: ' + action);

  } catch (error) {
    console.error('[Instance Manager] ❌ HÍBRIDO: Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Erro na Edge Function híbrida'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createInstanceHybrid(supabase: any, instanceName: string, user: any) {
  console.log(`[Instance Manager] 🚀 HÍBRIDO: Criando instância ${instanceName} com configuração do script`);

  try {
    if (!instanceName || instanceName.trim().length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
    }

    const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    console.log(`[Instance Manager] 📝 HÍBRIDO: Nome normalizado: ${normalizedName}`);

    // CONFIGURAÇÃO EXATA DO SCRIPT QUE FUNCIONA
    console.log(`[Instance Manager] 📡 HÍBRIDO: Usando configuração EXATA do script funcionando`);
    
    const vpsPayload = {
      instanceId: normalizedName,
      sessionName: normalizedName,
      webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
    };

    console.log(`[Instance Manager] 🎯 HÍBRIDO: Payload EXATO:`, vpsPayload);
    
    const vpsResponse = await fetch(`${VPS_SERVER_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
      },
      body: JSON.stringify(vpsPayload),
      signal: AbortSignal.timeout(30000)
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error(`[Instance Manager] ❌ HÍBRIDO: VPS erro ${vpsResponse.status}:`, errorText);
      throw new Error(`VPS responded with ${vpsResponse.status}: ${errorText}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[Instance Manager] ✅ HÍBRIDO: VPS response:`, vpsData);

    if (!vpsData.success) {
      throw new Error(vpsData.error || 'VPS retornou success: false');
    }

    // SALVAR NO SUPABASE COM USER ID CORRETO
    const { data: newInstance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .insert({
        instance_name: normalizedName,
        connection_type: 'web',
        server_url: VPS_SERVER_URL,
        vps_instance_id: vpsData.instanceId || normalizedName,
        web_status: 'initializing',
        connection_status: 'vps_pending',
        created_by_user_id: user.id,
        company_id: null
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Instance Manager] ❌ HÍBRIDO: Erro no banco:', dbError);
      throw new Error(`Erro ao salvar instância no banco: ${dbError.message}`);
    }

    console.log(`[Instance Manager] ✅ HÍBRIDO: Instância criada com sucesso:`, newInstance.id);

    return new Response(JSON.stringify({
      success: true,
      instance: newInstance,
      vps_response: vpsData,
      user_id: user.id,
      message: 'Instância criada com método híbrido - configuração do script'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ HÍBRIDO: Erro na criação:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      action: 'create_instance',
      instanceName: instanceName,
      method: 'hybrid'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function deleteInstanceCorrected(supabase: any, instanceId: string, user: any) {
  console.log(`[Instance Manager] 🗑️ HÍBRIDO: Deletando instância ${instanceId}`);
  
  try {
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) {
      throw new Error('Instância não encontrada: ' + fetchError.message);
    }

    console.log(`[Instance Manager] 📋 HÍBRIDO: Instância encontrada:`, instance.instance_name);

    if (instance.vps_instance_id) {
      try {
        console.log(`[Instance Manager] 📡 HÍBRIDO: Deletando na VPS: ${VPS_SERVER_URL}/instance/${instance.vps_instance_id}`);
        
        const vpsResponse = await fetch(`${VPS_SERVER_URL}/instance/${instance.vps_instance_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
          },
          signal: AbortSignal.timeout(15000)
        });

        if (!vpsResponse.ok) {
          console.error(`[Instance Manager] ⚠️ HÍBRIDO: VPS não deletou instância: ${vpsResponse.status}`);
        } else {
          console.log(`[Instance Manager] ✅ HÍBRIDO: VPS deletou instância com sucesso`);
        }
      } catch (vpsError) {
        console.error('[Instance Manager] ⚠️ HÍBRIDO: Erro ao comunicar com VPS:', vpsError);
      }
    }

    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      throw new Error(`Erro ao deletar instância do banco: ${deleteError.message}`);
    }

    console.log(`[Instance Manager] ✅ HÍBRIDO: Instância deletada do banco com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Instância deletada com sucesso (método híbrido)',
      user_id: user?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[Instance Manager] ❌ HÍBRIDO: Erro na deleção:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      action: 'delete_instance',
      instanceId: instanceId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
