
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 20000 // Aumentado para 20 segundos
};

async function makeVPSRequest(endpoint: string, method: string = 'GET', body?: any, retries: number = 3) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[VPS Cleanup] 🔧 ${method} ${url}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Cleanup-Service/1.0'
        },
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.body = JSON.stringify(body);
      }

      console.log(`[VPS Cleanup] 📤 Tentativa ${attempt}/${retries}`);
      if (body) {
        console.log(`[VPS Cleanup] 📋 Body:`, JSON.stringify(body, null, 2));
      }

      const response = await fetch(url, requestConfig);
      const responseText = await response.text();
      
      console.log(`[VPS Cleanup] 📊 Status: ${response.status}`);
      console.log(`[VPS Cleanup] 📥 Response:`, responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText, success: response.ok };
      }

      if (response.ok) {
        return { 
          success: true, 
          status: response.status, 
          data,
          attempt 
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
    } catch (error: any) {
      console.error(`[VPS Cleanup] ❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === retries) {
        return { 
          success: false, 
          status: 500,
          error: error.message,
          attempts: retries 
        };
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return { success: false, error: 'Máximo de tentativas excedido' };
}

async function deleteAllInstancesOneByOne() {
  console.log(`[VPS Cleanup] 🔥 INICIANDO DELEÇÃO MASSIVA v2.0`);
  
  try {
    // Buscar todas as instâncias
    const listResult = await makeVPSRequest('/instances', 'GET');
    
    if (!listResult.success) {
      throw new Error(`Falha ao listar instâncias: ${listResult.error}`);
    }

    const instances = listResult.data?.instances || [];
    console.log(`[VPS Cleanup] 📊 ${instances.length} instâncias encontradas`);

    if (instances.length === 0) {
      return {
        success: true,
        message: 'Nenhuma instância encontrada para deletar',
        total_instances: 0,
        deleted_count: 0,
        failed_count: 0
      };
    }

    const deleteResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Deletar cada instância com múltiplos métodos
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const instanceId = instance.instanceId || instance.id || instance.name;
      
      console.log(`[VPS Cleanup] 🗑️ [${i+1}/${instances.length}] Deletando: ${instanceId}`);

      let deleted = false;
      let deleteError = '';

      // Método 1: DELETE endpoint direto
      try {
        const deleteResult = await makeVPSRequest(`/instance/${instanceId}`, 'DELETE', null, 2);
        if (deleteResult.success) {
          console.log(`[VPS Cleanup] ✅ Método 1 - DELETE direto funcionou`);
          deleted = true;
        } else {
          console.log(`[VPS Cleanup] ⚠️ Método 1 falhou: ${deleteResult.error}`);
          deleteError += `M1: ${deleteResult.error}; `;
        }
      } catch (error) {
        console.log(`[VPS Cleanup] ⚠️ Método 1 erro: ${error.message}`);
        deleteError += `M1: ${error.message}; `;
      }

      // Método 2: POST /instance/delete
      if (!deleted) {
        try {
          const deleteResult = await makeVPSRequest('/instance/delete', 'POST', { instanceId }, 2);
          if (deleteResult.success) {
            console.log(`[VPS Cleanup] ✅ Método 2 - POST delete funcionou`);
            deleted = true;
          } else {
            console.log(`[VPS Cleanup] ⚠️ Método 2 falhou: ${deleteResult.error}`);
            deleteError += `M2: ${deleteResult.error}; `;
          }
        } catch (error) {
          console.log(`[VPS Cleanup] ⚠️ Método 2 erro: ${error.message}`);
          deleteError += `M2: ${error.message}; `;
        }
      }

      // Método 3: POST /instance/{id}/delete
      if (!deleted) {
        try {
          const deleteResult = await makeVPSRequest(`/instance/${instanceId}/delete`, 'POST', {}, 2);
          if (deleteResult.success) {
            console.log(`[VPS Cleanup] ✅ Método 3 - POST específico funcionou`);
            deleted = true;
          } else {
            console.log(`[VPS Cleanup] ⚠️ Método 3 falhou: ${deleteResult.error}`);
            deleteError += `M3: ${deleteResult.error}; `;
          }
        } catch (error) {
          console.log(`[VPS Cleanup] ⚠️ Método 3 erro: ${error.message}`);
          deleteError += `M3: ${error.message}; `;
        }
      }

      // Método 4: POST /stop primeiro, depois DELETE
      if (!deleted) {
        try {
          // Tentar parar primeiro
          await makeVPSRequest(`/instance/${instanceId}/stop`, 'POST', {}, 1);
          
          // Depois deletar
          const deleteResult = await makeVPSRequest(`/instance/${instanceId}`, 'DELETE', null, 2);
          if (deleteResult.success) {
            console.log(`[VPS Cleanup] ✅ Método 4 - Stop+Delete funcionou`);
            deleted = true;
          } else {
            console.log(`[VPS Cleanup] ⚠️ Método 4 falhou: ${deleteResult.error}`);
            deleteError += `M4: ${deleteResult.error}; `;
          }
        } catch (error) {
          console.log(`[VPS Cleanup] ⚠️ Método 4 erro: ${error.message}`);
          deleteError += `M4: ${error.message}; `;
        }
      }

      if (deleted) {
        successCount++;
        deleteResults.push({
          instanceId,
          success: true,
          status: 'deleted'
        });
      } else {
        errorCount++;
        deleteResults.push({
          instanceId,
          success: false,
          error: deleteError.trim(),
          status: 'failed'
        });
      }

      // Pausa entre deletes para não sobrecarregar
      if (i < instances.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    console.log(`[VPS Cleanup] 📊 RESULTADO: ${successCount}/${instances.length} deletadas`);

    return {
      success: true,
      total_instances: instances.length,
      deleted_count: successCount,
      failed_count: errorCount,
      delete_results: deleteResults,
      message: `Processo concluído: ${successCount} sucessos, ${errorCount} falhas de ${instances.length} instâncias`
    };

  } catch (error: any) {
    console.error(`[VPS Cleanup] ❌ Erro geral:`, error.message);
    return {
      success: false,
      error: error.message,
      message: 'Falha geral no processo de limpeza'
    };
  }
}

async function cleanupVPSSessions() {
  console.log(`[VPS Cleanup] 🧹 LIMPEZA DE SESSÕES VPS`);
  
  // Esta função simula comandos que deveriam ser executados via SSH
  const cleanupCommands = [
    'pm2 stop whatsapp-server',
    'rm -rf /root/.wwebjs_auth/session-*',
    'rm -rf /root/.wwebjs_cache/*',
    'pm2 start whatsapp-server'
  ];

  const results = [];
  
  for (const command of cleanupCommands) {
    console.log(`[VPS Cleanup] 🔧 Simulando: ${command}`);
    
    results.push({
      command,
      success: true,
      note: 'Comando simulado - execute via SSH para limpeza real'
    });
  }

  return {
    success: true,
    cleanup_commands: results,
    message: 'Comandos de limpeza listados. Execute via SSH para aplicar.',
    ssh_commands: cleanupCommands
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[VPS Cleanup] 🚀 SERVIÇO MELHORADO v2.0 INICIADO`);
    
    const { action } = await req.json();
    console.log(`[VPS Cleanup] 🎯 Ação solicitada: ${action}`);

    switch (action) {
      case 'list_instances': {
        console.log(`[VPS Cleanup] 📋 Listando instâncias...`);
        
        const listResult = await makeVPSRequest('/instances', 'GET');
        
        return new Response(
          JSON.stringify({
            success: listResult.success,
            instances: listResult.data?.instances || [],
            total: listResult.data?.instances?.length || 0,
            server_info: listResult.data,
            error: listResult.error
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_all_instances': {
        console.log(`[VPS Cleanup] 🔥 Iniciando deleção massiva...`);
        
        const result = await deleteAllInstancesOneByOne();
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cleanup_sessions': {
        console.log(`[VPS Cleanup] 🧹 Limpeza de sessões...`);
        
        const result = await cleanupVPSSessions();
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'full_cleanup': {
        console.log(`[VPS Cleanup] 🔥 LIMPEZA COMPLETA INICIADA`);
        
        const deleteResult = await deleteAllInstancesOneByOne();
        const cleanupResult = await cleanupVPSSessions();
        
        return new Response(
          JSON.stringify({
            success: true,
            delete_result: deleteResult,
            cleanup_result: cleanupResult,
            message: 'Limpeza completa executada. Verifique os resultados detalhados.',
            summary: {
              instances_deleted: deleteResult.deleted_count || 0,
              instances_failed: deleteResult.failed_count || 0,
              total_instances: deleteResult.total_instances || 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Ação não reconhecida: ${action}`,
            available_actions: ['list_instances', 'delete_all_instances', 'cleanup_sessions', 'full_cleanup']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error(`[VPS Cleanup] ❌ Erro geral:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        service: 'vps_cleanup_service_v2'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
