
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 20000
};

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

async function makeVPSRequest(endpoint: string, method: string = 'POST', body?: any, retries: number = 3) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  console.log(`[VPS Request] Tentativa 1/${retries} - ${method} ${url}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      };
      
      console.log(`[VPS Request] 📤 Headers:`, headers);
      
      if (body) {
        console.log(`[VPS Request] 📤 Payload enviado:`, JSON.stringify(body, null, 2));
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });
      
      console.log(`[VPS Response] Status: ${response.status}`);
      console.log(`[VPS Response] Headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log(`[VPS Response] Body: ${responseText}`);
      
      if (!response.ok) {
        throw new Error(`VPS Error ${response.status}: ${responseText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { success: true, message: responseText };
      }
      
      console.log(`[VPS Request] ✅ Sucesso na tentativa ${attempt}`);
      return {
        success: true,
        data: data
      };
      
    } catch (error: any) {
      console.error(`[VPS Request] ❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === retries) {
        return {
          success: false,
          error: error.message
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return {
    success: false,
    error: 'Máximo de tentativas excedido'
  };
}

async function handleCreateInstance(supabase: any, user: any, instanceName: string) {
  console.log(`[Instance Manager] 🚀 handleCreateInstance v4.0 INICIADO - SEM POLLING`);
  console.log(`[Instance Manager] 📊 instanceName recebido: ${instanceName}`);
  
  const userId = user.id;
  console.log(`[Instance Manager] ✅ Usuário autenticado: ${userId}`);

  // Normalizar nome da instância
  const normalizedName = instanceName.toLowerCase().replace(/[^a-z0-9]/g, '');
  console.log(`[Instance Manager] ✅ Nome normalizado: ${normalizedName}`);

  // Verificar duplicatas
  console.log(`[Instance Manager] 🔍 Verificando duplicatas para usuário ${userId}...`);
  const { data: existingInstances, error: duplicateError } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('created_by_user_id', userId)
    .eq('instance_name', normalizedName);

  if (duplicateError) {
    throw new Error(`Erro ao verificar duplicatas: ${duplicateError.message}`);
  }

  if (existingInstances && existingInstances.length > 0) {
    throw new Error(`Já existe uma instância com o nome "${normalizedName}"`);
  }

  // Gerar ID único para VPS
  const vpsInstanceId = `instance_${userId}_${normalizedName}_${Date.now()}`;
  console.log(`[Instance Manager] 🏗️ Criando instância na VPS: ${vpsInstanceId}`);

  // Preparar payload para VPS
  const vpsPayload = {
    instanceId: vpsInstanceId,
    sessionName: normalizedName,
    webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service',
    settings: {
      autoReconnect: true,
      markMessages: false,
      syncFullHistory: false
    }
  };

  console.log(`[Instance Manager] 📤 Payload preparado:`, JSON.stringify(vpsPayload, null, 2));

  // Criar instância na VPS
  const vpsResult = await makeVPSRequest('/instance/create', 'POST', vpsPayload);

  if (!vpsResult.success) {
    throw new Error(`Falha ao criar instância na VPS: ${vpsResult.error}`);
  }

  console.log(`[Instance Manager] ✅ Instância criada na VPS com sucesso:`, vpsResult.data);

  // Salvar no Supabase
  console.log(`[Instance Manager] 💾 Inserindo no Supabase...`);
  const { data: instance, error: dbError } = await supabase
    .from('whatsapp_instances')
    .insert({
      instance_name: normalizedName,
      vps_instance_id: vpsInstanceId,
      connection_status: 'connecting',
      connection_type: 'web',
      server_url: VPS_CONFIG.baseUrl,
      created_by_user_id: userId,
      web_status: 'connecting'
    })
    .select()
    .single();

  if (dbError) {
    console.error(`[Instance Manager] ❌ Erro no banco:`, dbError);
    // Tentar limpar da VPS se deu erro no banco
    await makeVPSRequest('/instance/delete', 'POST', { instanceId: vpsInstanceId });
    throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
  }

  console.log(`[Instance Manager] ✅ Instância criada com sucesso - AGUARDANDO WEBHOOK DA VPS:`, instance);

  return {
    success: true,
    instance: instance,
    vps_response: vpsResult.data,
    message: 'Instância criada com sucesso. Aguardando QR Code via webhook da VPS.',
    webhook_expected: true
  };
}

async function handleDeleteInstance(supabase: any, user: any, instanceId: string) {
  console.log(`[Instance Manager] 🗑️ DELETANDO INSTÂNCIA: ${instanceId}`);
  
  const userId = user.id;

  // Buscar instância no banco
  const { data: instance, error: fetchError } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('id', instanceId)
    .eq('created_by_user_id', userId)
    .single();

  if (fetchError || !instance) {
    throw new Error('Instância não encontrada ou sem permissão');
  }

  console.log(`[Instance Manager] 📋 Instância encontrada: ${instance.instance_name}`);

  // CORREÇÃO: Deletar da VPS usando endpoint correto
  if (instance.vps_instance_id) {
    console.log(`[Instance Manager] 🔥 Deletando da VPS: ${instance.vps_instance_id}`);
    
    // Tentar múltiplos endpoints de delete
    const deleteEndpoints = [
      { endpoint: '/instance/delete', body: { instanceId: instance.vps_instance_id } },
      { endpoint: `/instance/${instance.vps_instance_id}/delete`, body: null, method: 'DELETE' },
      { endpoint: `/instance/${instance.vps_instance_id}`, body: null, method: 'DELETE' }
    ];

    let vpsDeleted = false;
    for (const { endpoint, body, method } of deleteEndpoints) {
      try {
        const vpsResult = await makeVPSRequest(endpoint, method || 'POST', body, 1);
        if (vpsResult.success) {
          console.log(`[Instance Manager] ✅ VPS delete bem-sucedido via ${endpoint}`);
          vpsDeleted = true;
          break;
        }
      } catch (error) {
        console.log(`[Instance Manager] ⚠️ Endpoint ${endpoint} falhou:`, error.message);
      }
    }

    if (!vpsDeleted) {
      console.log(`[Instance Manager] ⚠️ Não foi possível deletar da VPS, continuando com banco`);
    }
  }

  // Deletar do banco
  const { error: deleteError } = await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', instanceId);

  if (deleteError) {
    throw new Error(`Erro ao deletar do banco: ${deleteError.message}`);
  }

  console.log(`[Instance Manager] ✅ Instância deletada com sucesso`);

  return {
    success: true,
    message: 'Instância deletada com sucesso',
    vps_deleted: true
  };
}

async function handleCleanupOrphanInstances(supabase: any) {
  console.log(`[Instance Manager] 🧹 LIMPEZA DE INSTÂNCIAS ÓRFÃS`);
  
  try {
    // Buscar instâncias órfãs (sem qr_code há mais de 10 minutos e status initializing)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: orphanInstances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .is('qr_code', null)
      .eq('web_status', 'connecting')
      .lt('created_at', tenMinutesAgo);

    if (fetchError) {
      throw new Error(`Erro ao buscar órfãs: ${fetchError.message}`);
    }

    console.log(`[Instance Manager] 📊 ${orphanInstances?.length || 0} instâncias órfãs encontradas`);

    if (orphanInstances && orphanInstances.length > 0) {
      // Deletar órfãs do banco (VPS pode ter falhado)
      const orphanIds = orphanInstances.map(i => i.id);
      
      const { error: cleanupError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .in('id', orphanIds);

      if (cleanupError) {
        console.error(`[Instance Manager] ❌ Erro na limpeza:`, cleanupError);
      } else {
        console.log(`[Instance Manager] ✅ ${orphanIds.length} instâncias órfãs removidas`);
      }
    }

    return {
      success: true,
      cleaned_instances: orphanInstances?.length || 0
    };
  } catch (error: any) {
    console.error(`[Instance Manager] ❌ Erro na limpeza:`, error);
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
    console.log(`[Instance Manager] 📡 REQUEST: ${req.method} ${req.url}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log(`[Instance Manager] 📥 Raw body: ${JSON.stringify(body)}`);
    console.log(`[Instance Manager] 📦 Parsed body:`, body);

    const { action } = body;
    console.log(`[Instance Manager] 🎯 Action: ${action}`);

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
        console.log(`[Instance Manager] 🚀 EXECUTANDO CREATE_INSTANCE v4.0 - SEM POLLING`);
        
        const { instanceName } = body;
        if (!instanceName) {
          throw new Error('Nome da instância é obrigatório');
        }

        const result = await handleCreateInstance(supabase, user, instanceName);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_instance': {
        console.log(`[Instance Manager] 🗑️ EXECUTANDO DELETE_INSTANCE`);
        
        const { instanceId } = body;
        if (!instanceId) {
          throw new Error('ID da instância é obrigatório');
        }

        const result = await handleDeleteInstance(supabase, user, instanceId);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cleanup_orphans': {
        console.log(`[Instance Manager] 🧹 EXECUTANDO CLEANUP_ORPHANS`);
        
        const result = await handleCleanupOrphanInstances(supabase);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error(`[Instance Manager] ❌ Erro geral:`, error);
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
