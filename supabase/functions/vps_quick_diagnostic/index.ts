
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Diagnostic] 🔍 Iniciando diagnóstico rápido da VPS');
    
    const startTime = Date.now();
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        vps_online: false,
        whatsapp_server_online: false,
        connectivity_issues: [],
        recommendations: []
      }
    };

    // Teste 1: Ping básico VPS (porta 3001)
    console.log('[VPS Diagnostic] 📡 Testando conectividade porta 3001...');
    try {
      const vpsResponse = await fetch('http://31.97.24.222:3001/health', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const vpsData = await vpsResponse.text();
      results.tests.vps_port_3001 = {
        status: vpsResponse.ok ? 'SUCCESS' : 'ERROR',
        response_code: vpsResponse.status,
        response_time: Date.now() - startTime,
        response_data: vpsData.substring(0, 500)
      };
      
      if (vpsResponse.ok) {
        results.summary.vps_online = true;
        results.summary.whatsapp_server_online = true;
      }
      
    } catch (error: any) {
      console.log('[VPS Diagnostic] ❌ Erro porta 3001:', error.message);
      results.tests.vps_port_3001 = {
        status: 'ERROR',
        error: error.message,
        response_time: Date.now() - startTime
      };
      results.summary.connectivity_issues.push('VPS porta 3001 inacessível');
    }

    // Teste 2: Testar porta alternativa 3002 (se existir)
    console.log('[VPS Diagnostic] 📡 Testando conectividade porta 3002...');
    try {
      const vps3002Response = await fetch('http://31.97.24.222:3002/health', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const vps3002Data = await vps3002Response.text();
      results.tests.vps_port_3002 = {
        status: vps3002Response.ok ? 'SUCCESS' : 'ERROR',
        response_code: vps3002Response.status,
        response_time: Date.now() - startTime,
        response_data: vps3002Data.substring(0, 500)
      };
      
    } catch (error: any) {
      console.log('[VPS Diagnostic] ❌ Erro porta 3002:', error.message);
      results.tests.vps_port_3002 = {
        status: 'ERROR',
        error: error.message
      };
    }

    // Teste 3: Verificar instâncias endpoint
    if (results.summary.vps_online) {
      console.log('[VPS Diagnostic] 📋 Testando endpoint de instâncias...');
      try {
        const instancesResponse = await fetch('http://31.97.24.222:3001/instances', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        const instancesData = await instancesResponse.text();
        results.tests.instances_endpoint = {
          status: instancesResponse.ok ? 'SUCCESS' : 'ERROR',
          response_code: instancesResponse.status,
          response_data: instancesData.substring(0, 500)
        };
        
      } catch (error: any) {
        console.log('[VPS Diagnostic] ❌ Erro endpoint instâncias:', error.message);
        results.tests.instances_endpoint = {
          status: 'ERROR',
          error: error.message
        };
        results.summary.connectivity_issues.push('Endpoint /instances inacessível');
      }
    }

    // Gerar recomendações
    if (!results.summary.vps_online) {
      results.summary.recommendations.push('VPS está offline ou inacessível');
      results.summary.recommendations.push('Verifique se a VPS está rodando');
      results.summary.recommendations.push('Verifique configurações de firewall');
    } else if (results.summary.connectivity_issues.length > 0) {
      results.summary.recommendations.push('VPS online mas com problemas nos endpoints');
      results.summary.recommendations.push('Verifique se o servidor WhatsApp está rodando');
      results.summary.recommendations.push('Verifique logs do PM2');
    } else {
      results.summary.recommendations.push('VPS e servidor WhatsApp parecem estar funcionando');
      results.summary.recommendations.push('Problema pode estar na configuração da aplicação');
    }

    const totalTime = Date.now() - startTime;
    console.log(`[VPS Diagnostic] ✅ Diagnóstico concluído em ${totalTime}ms`);
    
    return new Response(JSON.stringify({
      success: true,
      diagnostic_results: results,
      total_time_ms: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[VPS Diagnostic] ❌ Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
