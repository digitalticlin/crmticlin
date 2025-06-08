
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Auto Corrector] 🔧 INICIANDO CORREÇÃO AUTOMÁTICA DA VPS');
    
    const { action } = await req.json();
    
    const VPS_HOST = '31.97.24.222';
    const VPS_PORT = '3001';
    const VPS_BASE_URL = `http://${VPS_HOST}:${VPS_PORT}`;
    
    // Lista de tokens para teste
    const POSSIBLE_TOKENS = [
      '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
      'default-token',
      'whatsapp-token',
      'api-token',
      'bearer-token',
      ''  // Sem token
    ];
    
    if (action === 'discover_working_config') {
      console.log('[VPS Auto Corrector] 🔍 Descobrindo configuração funcional...');
      
      let workingToken = null;
      let workingEndpoints = {};
      
      // 1. Descobrir token funcional
      for (const token of POSSIBLE_TOKENS) {
        try {
          console.log(`[VPS Auto Corrector] 🧪 Testando token: ${token ? token.substring(0, 15) + '...' : 'SEM TOKEN'}`);
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['X-API-Token'] = token;
          }
          
          const response = await fetch(`${VPS_BASE_URL}/health`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(10000)
          });
          
          console.log(`[VPS Auto Corrector] 📊 Response: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`[VPS Auto Corrector] ✅ TOKEN FUNCIONAL ENCONTRADO: ${token ? token.substring(0, 15) + '...' : 'SEM TOKEN'}`);
            console.log(`[VPS Auto Corrector] 📋 Health data:`, data);
            workingToken = token;
            break;
          }
        } catch (error) {
          console.log(`[VPS Auto Corrector] ❌ Erro no teste: ${error.message}`);
        }
      }
      
      if (!workingToken && workingToken !== '') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Nenhum token funcional encontrado',
            tested_tokens: POSSIBLE_TOKENS.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // 2. Descobrir endpoints funcionais
      const endpointsToTest = [
        { name: 'instances', path: '/instances', method: 'GET' },
        { name: 'create', path: '/instance/create', method: 'POST' },
        { name: 'qr_get', path: '/qr/test', method: 'GET' },
        { name: 'qr_post', path: '/instance/test/qr', method: 'POST' }
      ];
      
      for (const endpoint of endpointsToTest) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          
          if (workingToken) {
            headers['Authorization'] = `Bearer ${workingToken}`;
            headers['X-API-Token'] = workingToken;
          }
          
          const response = await fetch(`${VPS_BASE_URL}${endpoint.path}`, {
            method: endpoint.method,
            headers,
            body: endpoint.method === 'POST' ? JSON.stringify({}) : undefined,
            signal: AbortSignal.timeout(8000)
          });
          
          workingEndpoints[endpoint.name] = {
            path: endpoint.path,
            method: endpoint.method,
            status: response.status,
            working: response.status !== 404
          };
          
          console.log(`[VPS Auto Corrector] 🎯 Endpoint ${endpoint.name}: ${response.status}`);
        } catch (error) {
          workingEndpoints[endpoint.name] = {
            path: endpoint.path,
            method: endpoint.method,
            error: error.message,
            working: false
          };
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          discovered_config: {
            working_token: workingToken,
            token_masked: workingToken ? workingToken.substring(0, 15) + '...' : 'SEM TOKEN',
            base_url: VPS_BASE_URL,
            endpoints: workingEndpoints
          },
          recommendations: [
            workingToken ? `Usar token: ${workingToken.substring(0, 15)}...` : 'VPS não requer autenticação',
            'Atualizar VPS_API_TOKEN secret no Supabase',
            'Testar criação de instância com nova configuração'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'test_instance_creation') {
      console.log('[VPS Auto Corrector] 🧪 Testando criação de instância...');
      
      const workingToken = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'; // Token descoberto
      
      const testPayload = {
        instanceId: `test_correction_${Date.now()}`,
        sessionName: 'test_correction',
        webhookUrl: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/whatsapp_qr_service'
      };
      
      try {
        const response = await fetch(`${VPS_BASE_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${workingToken}`,
            'X-API-Token': workingToken
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(15000)
        });
        
        const responseText = await response.text();
        console.log(`[VPS Auto Corrector] 📊 Create response: ${response.status}`);
        console.log(`[VPS Auto Corrector] 📋 Response body: ${responseText}`);
        
        return new Response(
          JSON.stringify({
            success: response.ok,
            test_result: {
              status: response.status,
              response: responseText,
              payload_sent: testPayload
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            payload_sent: testPayload
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('[VPS Auto Corrector] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
