
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000
};

function getVPSHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-VPS-Cleanup/1.0',
    'Accept': 'application/json'
  };
}

async function makeVPSRequest(endpoint: string, method: string = 'POST', body?: any) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  
  console.log(`[VPS Cleanup] 🌐 ${method} ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VPS_CONFIG.timeout);
    
    const response = await fetch(url, {
      method,
      headers: getVPSHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseText = await response.text();
    console.log(`[VPS Cleanup] 📊 Response ${response.status}:`, responseText.substring(0, 200));
    
    if (!response.ok) {
      return {
        success: false,
        error: `VPS Error: ${response.status} - ${responseText}`,
        status: response.status
      };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText };
    }
    
    return {
      success: true,
      data: data
    };
    
  } catch (error: any) {
    console.error(`[VPS Cleanup] ❌ Erro:`, error.message);
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
    const { action } = await req.json();
    console.log(`[VPS Cleanup] 🧹 Ação: ${action}`);

    if (action === 'delete_all_instances') {
      console.log('[VPS Cleanup] 🔍 Listando instâncias para limpeza...');
      
      // 1. Listar todas as instâncias
      const listResult = await makeVPSRequest('/instances', 'GET');
      
      if (!listResult.success) {
        throw new Error(`Erro ao listar instâncias: ${listResult.error}`);
      }
      
      const instances = listResult.data?.instances || [];
      console.log(`[VPS Cleanup] 📊 Encontradas ${instances.length} instâncias`);
      
      if (instances.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            deletedCount: 0,
            message: 'Nenhuma instância encontrada para deletar'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 2. Deletar todas as instâncias usando POST /instance/delete
      let deletedCount = 0;
      const errors: string[] = [];
      
      for (const instance of instances) {
        const instanceId = instance.instanceId;
        console.log(`[VPS Cleanup] 🗑️ Deletando: ${instanceId}`);
        
        const deleteResult = await makeVPSRequest('/instance/delete', 'POST', {
          instanceId: instanceId
        });
        
        if (deleteResult.success) {
          deletedCount++;
          console.log(`[VPS Cleanup] ✅ Deletado: ${instanceId}`);
        } else {
          const error = `Erro ao deletar ${instanceId}: ${deleteResult.error}`;
          errors.push(error);
          console.error(`[VPS Cleanup] ❌ ${error}`);
        }
        
        // Pequena pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`[VPS Cleanup] 📊 Limpeza concluída: ${deletedCount}/${instances.length} deletadas`);
      
      return new Response(
        JSON.stringify({
          success: true,
          deletedCount,
          totalFound: instances.length,
          errors: errors.length > 0 ? errors : undefined,
          message: `Limpeza concluída: ${deletedCount} instâncias deletadas`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Ação não reconhecida: ${action}`,
        available_actions: ['delete_all_instances']
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VPS Cleanup] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        service: 'vps_cleanup_service'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
