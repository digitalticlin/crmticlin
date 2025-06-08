
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 30000
};

interface InstanceCreateRequest {
  instanceName: string;
  webhookUrl?: string;
}

interface InstanceDeleteRequest {
  instanceId: string;
}

async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, user };
}

async function makeVPSRequest(endpoint: string, method: string = 'GET', payload?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[Instance Manager] ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`
    },
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const responseText = await response.text();
  
  console.log(`[Instance Manager] Response (${response.status}):`, responseText.substring(0, 200));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  return { response, data };
}

async function createVPSInstance(instanceName: string, webhookUrl?: string) {
  console.log(`[Instance Manager] 🆕 Criando instância VPS: ${instanceName}`);
  
  const payload = {
    instanceId: instanceName,
    sessionName: instanceName,
    webhookUrl: webhookUrl || 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_messaging_service',
    userId: 'user-integration'
  };

  const { response, data } = await makeVPSRequest('/instance/create', 'POST', payload);

  if (response.ok && data.success) {
    console.log(`[Instance Manager] ✅ Instância VPS criada:`, data);
    return {
      success: true,
      vpsInstanceId: data.instanceId || instanceName,
      vpsResponse: data
    };
  } else {
    throw new Error(data.message || data.error || 'Falha ao criar instância na VPS');
  }
}

async function deleteVPSInstance(vpsInstanceId: string) {
  console.log(`[Instance Manager] 🗑️ Deletando instância VPS: ${vpsInstanceId}`);
  
  const payload = { instanceId: vpsInstanceId };
  const { response, data } = await makeVPSRequest('/instance/delete', 'POST', payload);

  if (response.ok) {
    console.log(`[Instance Manager] ✅ Instância VPS deletada`);
    return { success: true };
  } else {
    console.warn(`[Instance Manager] ⚠️ Erro ao deletar VPS:`, data);
    return { success: false, error: data.message || 'Falha ao deletar da VPS' };
  }
}

async function syncVPSInstances(supabase: any, userId: string) {
  console.log(`[Instance Manager] 🔄 Sincronizando instâncias`);
  
  try {
    const { response, data } = await makeVPSRequest('/instances', 'GET');
    
    if (!response.ok) {
      throw new Error('Falha ao obter instâncias da VPS');
    }

    const vpsInstances = data.instances || data || [];
    console.log(`[Instance Manager] 📊 ${vpsInstances.length} instâncias encontradas na VPS`);

    const { count } = await supabase
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true })
      .eq('created_by_user_id', userId);

    return {
      success: true,
      summary: {
        vpsInstances: vpsInstances.length,
        dbInstances: count || 0,
        synced: true
      }
    };
  } catch (error: any) {
    console.error(`[Instance Manager] ❌ Erro na sincronização:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    console.log(`[Instance Manager] 🎯 Ação: ${action}`);

    // Autenticar usuário
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    switch (action) {
      case 'create_instance': {
        const { instanceName, webhookUrl }: InstanceCreateRequest = body;
        
        if (!instanceName) {
          return new Response(
            JSON.stringify({ success: false, error: 'Nome da instância é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Criar na VPS
        const vpsResult = await createVPSInstance(instanceName, webhookUrl);
        
        // Salvar no banco usando created_by_user_id
        const { data: dbInstance, error: dbError } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: instanceName,
            vps_instance_id: vpsResult.vpsInstanceId,
            connection_status: 'created',
            web_status: 'waiting_qr',
            connection_type: 'web',
            created_by_user_id: user.id,
            webhook_url: webhookUrl
          })
          .select()
          .single();

        if (dbError) {
          console.error('[Instance Manager] ❌ Erro no banco:', dbError);
          throw new Error(`Erro no banco: ${dbError.message}`);
        }

        console.log(`[Instance Manager] ✅ Instância criada - DB ID: ${dbInstance.id}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Instância criada com sucesso',
            instance: {
              id: dbInstance.id,
              instance_name: instanceName,
              vps_instance_id: vpsResult.vpsInstanceId,
              connection_status: 'created',
              web_status: 'waiting_qr'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_instance': {
        const { instanceId }: InstanceDeleteRequest = body;
        
        if (!instanceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'ID da instância é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Buscar instância
        const { data: instance, error: fetchError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('id', instanceId)
          .eq('created_by_user_id', user.id)
          .single();

        if (fetchError || !instance) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instância não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Deletar da VPS se existir
        if (instance.vps_instance_id) {
          await deleteVPSInstance(instance.vps_instance_id);
        }

        // Deletar do banco
        const { error: deleteError } = await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', instanceId)
          .eq('created_by_user_id', user.id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Instância deletada com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_instances': {
        const syncResult = await syncVPSInstances(supabase, user.id);
        
        return new Response(
          JSON.stringify(syncResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_instances': {
        const { data: instances, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('created_by_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        return new Response(
          JSON.stringify({ success: true, instances }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação não reconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Instance Manager] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
