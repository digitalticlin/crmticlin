
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 25000
};

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[Instance Manager] 🔧 ${method} ${url}`);
  
  try {
    const requestConfig: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    };

    if (body && method === 'POST') {
      requestConfig.body = JSON.stringify(body);
      console.log(`[Instance Manager] 📋 Body:`, JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, requestConfig);
    const responseText = await response.text();
    
    console.log(`[Instance Manager] 📊 Status: ${response.status}`);
    console.log(`[Instance Manager] 📥 Response:`, responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText, success: response.ok };
    }

    return { 
      success: response.ok, 
      status: response.status, 
      data 
    };
  } catch (error: any) {
    console.error(`[Instance Manager] ❌ Erro:`, error.message);
    return { 
      success: false, 
      status: 500,
      error: error.message 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Instance Manager] 🚀 CORREÇÃO - Endpoints corrigidos v2.0');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, instanceName, instanceId } = await req.json();
    console.log(`[Instance Manager] 🎯 Action: ${action}`);

    if (action === 'create_instance') {
      console.log('[Instance Manager] 🏗️ Criando instância (mantido endpoint correto)');
      
      if (!instanceName) {
        throw new Error('Nome da instância é obrigatório');
      }

      // Obter dados da sessão do usuário
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Token de autorização necessário');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const vpsInstanceId = `instance_${user.id}_${instanceName}_${Date.now()}`;
      
      // Criar instância na VPS (endpoint já correto)
      const vpsResult = await makeVPSRequest('/instance/create', 'POST', {
        instanceId: vpsInstanceId,
        sessionName: instanceName,
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web'
      });

      if (!vpsResult.success) {
        throw new Error(`Falha na VPS: ${vpsResult.error}`);
      }

      // Salvar no Supabase
      const { data: instance, error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName,
          vps_instance_id: vpsInstanceId,
          connection_status: 'connecting',
          connection_type: 'web',
          server_url: VPS_CONFIG.baseUrl,
          created_by_user_id: user.id
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Erro no banco: ${dbError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          instance: instance,
          vps_response: vpsResult.data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_instance_corrected' || action === 'delete_instance') {
      console.log('[Instance Manager] 🗑️ CORREÇÃO: Deletando com POST /instance/delete');
      
      if (!instanceId) {
        throw new Error('instanceId é obrigatório');
      }

      // Buscar instância no banco
      const { data: instance, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (fetchError || !instance) {
        throw new Error('Instância não encontrada no banco');
      }

      // CORREÇÃO: Deletar da VPS usando endpoint correto POST /instance/delete
      const vpsResult = await makeVPSRequest('/instance/delete', 'POST', {
        instanceId: instance.vps_instance_id
      });

      console.log(`[Instance Manager] 📊 VPS Delete Result:`, vpsResult);

      // Deletar do banco independente do resultado da VPS
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (deleteError) {
        throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Instância deletada com sucesso',
          vps_result: vpsResult,
          endpoint_used: 'POST /instance/delete'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Ação não reconhecida: ${action}`,
        available_actions: ['create_instance', 'delete_instance_corrected']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Instance Manager] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'whatsapp_instance_manager_v2_corrected'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
