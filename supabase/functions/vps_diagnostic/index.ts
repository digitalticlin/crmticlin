
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { test, testToken, newToken, vpsAction } = await req.json();
    console.log(`[VPS Diagnostic] Test: ${test}`);

    // NOVO: Teste de atualização de token
    if (test === 'update_token') {
      console.log(`[VPS Diagnostic] Atualizando VPS_API_TOKEN...`);
      
      try {
        // Usar o Supabase Admin API para atualizar secrets
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/secrets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({
            name: 'VPS_API_TOKEN',
            value: newToken
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update secret: ${response.status} ${errorText}`);
        }

        console.log(`[VPS Diagnostic] ✅ Token atualizado com sucesso`);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'VPS_API_TOKEN atualizado com sucesso',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error: any) {
        console.error(`[VPS Diagnostic] ❌ Erro ao atualizar token:`, error);
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Erro ao atualizar token: ${error.message}`,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // VPS Configuration
    const VPS_CONFIG = {
      host: '31.97.24.222',
      port: '3001',
      get baseUrl() {
        return `http://${this.host}:${this.port}`;
      },
      authToken: testToken || Deno.env.get('VPS_API_TOKEN') || 'default-token'
    };

    const getVPSHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'User-Agent': 'Supabase-VPS-Diagnostic/2.0',
      'Accept': 'application/json'
    });

    const startTime = Date.now();

    // Test: VPS Connectivity
    if (test === 'vps_connectivity') {
      console.log('[VPS Diagnostic] 🔧 Testando conectividade VPS...');
      
      try {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(10000)
        });

        const duration = Date.now() - startTime;
        const responseText = await response.text();

        if (response.ok) {
          const data = JSON.parse(responseText);
          console.log('[VPS Diagnostic] ✅ VPS conectado:', data);
          
          return new Response(
            JSON.stringify({
              success: true,
              duration,
              details: data,
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(`VPS Error ${response.status}: ${responseText}`);
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[VPS Diagnostic] ❌ Erro de conectividade:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            duration,
            error: `Connectivity Error: ${error.message}`,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: VPS Authentication
    if (test === 'vps_auth') {
      console.log('[VPS Diagnostic] 🔐 Testando autenticação VPS...');
      
      try {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(10000)
        });

        const duration = Date.now() - startTime;
        const responseText = await response.text();

        if (response.ok) {
          const data = JSON.parse(responseText);
          
          // Verificar se o servidor aceita nosso token
          const authSuccess = response.status === 200;
          
          console.log('[VPS Diagnostic] ✅ Autenticação testada:', { authSuccess, data });
          
          return new Response(
            JSON.stringify({
              success: authSuccess,
              duration,
              details: {
                ...data,
                token_tested: VPS_CONFIG.authToken.substring(0, 10) + '...',
                auth_accepted: authSuccess
              },
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(`Auth failed: ${response.status} ${responseText}`);
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[VPS Diagnostic] ❌ Erro de autenticação:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            duration,
            error: `Authentication Error: ${error.message}`,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: VPS Services
    if (test === 'vps_services') {
      console.log('[VPS Diagnostic] ⚙️ Testando serviços VPS...');
      
      try {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(15000)
        });

        const duration = Date.now() - startTime;
        const responseText = await response.text();

        if (response.ok) {
          const data = JSON.parse(responseText);
          console.log('[VPS Diagnostic] ✅ Serviços VPS funcionando:', data);
          
          return new Response(
            JSON.stringify({
              success: true,
              duration,
              details: data,
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(`Services Error ${response.status}: ${responseText}`);
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[VPS Diagnostic] ❌ Erro nos serviços:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            duration,
            error: `Services Error: ${error.message}`,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: Full Flow (check_server)
    if (test === 'full_flow') {
      console.log('[VPS Diagnostic] 🔄 Testando fluxo completo...');
      
      try {
        // Testar health
        const healthResponse = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(10000)
        });

        if (!healthResponse.ok) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }

        const healthData = await healthResponse.json();

        // Testar instances
        const instancesResponse = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(10000)
        });

        let instancesData = {};
        if (instancesResponse.ok) {
          instancesData = await instancesResponse.json();
        }

        const duration = Date.now() - startTime;
        
        console.log('[VPS Diagnostic] ✅ Fluxo completo funcionando');
        
        return new Response(
          JSON.stringify({
            success: true,
            duration,
            details: {
              health: healthData,
              instances: instancesData,
              flow_status: 'complete'
            },
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[VPS Diagnostic] ❌ Erro no fluxo completo:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            duration,
            error: `Full Flow Error: ${error.message}`,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: Edge Function Health
    if (test === 'edge_function') {
      console.log('[VPS Diagnostic] 🔍 Testando saúde da Edge Function...');
      
      const duration = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({
          success: true,
          duration,
          details: {
            edge_function: 'vps_diagnostic',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            vps_config: {
              host: VPS_CONFIG.host,
              port: VPS_CONFIG.port,
              token_length: VPS_CONFIG.authToken.length
            }
          },
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default response for unknown tests
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unknown test: ${test}`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VPS Diagnostic] ❌ Erro geral:', error);
    
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
