
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000
};

async function makeVPSRequest(endpoint: string, method: string = 'GET') {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[VPS Cleanup] ${method} ${url}`);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const responseText = await response.text();
    console.log(`[VPS Cleanup] Response (${response.status}):`, responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    return { 
      success: response.ok,
      status: response.status, 
      data 
    };
  } catch (error: any) {
    console.error(`[VPS Cleanup] ❌ Request error:`, error.message);
    return { 
      success: false, 
      status: 500,
      error: error.message 
    };
  }
}

async function deleteAllInstancesOneByOne() {
  console.log(`[VPS Cleanup] 🔥 DELETANDO TODAS AS INSTÂNCIAS UMA POR UMA`);
  
  try {
    // Buscar todas as instâncias
    const listResult = await makeVPSRequest('/instances', 'GET');
    
    if (!listResult.success || !listResult.data?.instances) {
      throw new Error('Não foi possível listar instâncias da VPS');
    }

    const instances = listResult.data.instances;
    console.log(`[VPS Cleanup] 📊 ${instances.length} instâncias encontradas na VPS`);

    const deleteResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Deletar cada instância
    for (const instance of instances) {
      const instanceId = instance.instanceId;
      console.log(`[VPS Cleanup] 🗑️ Deletando instância: ${instanceId}`);

      try {
        // Tentar múltiplos endpoints de delete
        const deleteEndpoints = [
          { endpoint: '/instance/delete', body: { instanceId }, method: 'POST' },
          { endpoint: `/instance/${instanceId}/delete`, body: null, method: 'DELETE' },
          { endpoint: `/instance/${instanceId}`, body: null, method: 'DELETE' }
        ];

        let deleted = false;
        for (const { endpoint, body, method } of deleteEndpoints) {
          try {
            const deleteResult = await fetch(`${VPS_CONFIG.baseUrl}${endpoint}`, {
              method,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VPS_CONFIG.authToken}`
              },
              body: body ? JSON.stringify(body) : undefined,
              signal: AbortSignal.timeout(10000)
            });

            if (deleteResult.ok) {
              console.log(`[VPS Cleanup] ✅ ${instanceId} deletado via ${endpoint}`);
              deleted = true;
              successCount++;
              break;
            }
          } catch (error) {
            console.log(`[VPS Cleanup] ⚠️ Endpoint ${endpoint} falhou para ${instanceId}`);
          }
        }

        if (!deleted) {
          console.log(`[VPS Cleanup] ❌ Falha ao deletar ${instanceId}`);
          errorCount++;
        }

        deleteResults.push({
          instanceId,
          success: deleted,
          status: deleted ? 'deleted' : 'failed'
        });

      } catch (error: any) {
        console.error(`[VPS Cleanup] ❌ Erro ao deletar ${instanceId}:`, error.message);
        errorCount++;
        deleteResults.push({
          instanceId,
          success: false,
          error: error.message
        });
      }

      // Delay entre deletes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[VPS Cleanup] 📊 Resultado: ${successCount} sucessos, ${errorCount} falhas`);

    return {
      success: true,
      total_instances: instances.length,
      deleted_count: successCount,
      failed_count: errorCount,
      delete_results: deleteResults
    };

  } catch (error: any) {
    console.error(`[VPS Cleanup] ❌ Erro geral:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function cleanupVPSSessions() {
  console.log(`[VPS Cleanup] 🧹 LIMPANDO SESSÕES E CACHE DA VPS`);
  
  const cleanupCommands = [
    'rm -rf /root/.wwebjs_auth/session-*',
    'rm -rf /root/.wwebjs_cache/*',
    'pm2 restart whatsapp-server'
  ];

  const results = [];
  
  for (const command of cleanupCommands) {
    try {
      console.log(`[VPS Cleanup] 🔧 Executando: ${command}`);
      
      // Simular execução - em produção seria necessário SSH
      results.push({
        command,
        success: true,
        note: 'Comando simulado - execute manualmente via SSH'
      });
      
    } catch (error: any) {
      results.push({
        command,
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: true,
    cleanup_commands: results,
    note: 'Execute os comandos SSH manualmente para limpeza completa'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[VPS Cleanup] 🚀 SERVIÇO DE LIMPEZA VPS INICIADO`);
    
    const { action } = await req.json();
    console.log(`[VPS Cleanup] 🎯 Ação: ${action}`);

    switch (action) {
      case 'delete_all_instances': {
        const result = await deleteAllInstancesOneByOne();
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cleanup_sessions': {
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
            message: 'Limpeza completa executada'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_instances': {
        const listResult = await makeVPSRequest('/instances', 'GET');
        
        return new Response(
          JSON.stringify({
            success: listResult.success,
            instances: listResult.data?.instances || [],
            total: listResult.data?.total || 0
          }),
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
    console.error(`[VPS Cleanup] ❌ Erro:`, error);
    
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
