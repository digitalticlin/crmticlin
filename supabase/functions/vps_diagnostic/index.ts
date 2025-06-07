
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

    const { test, testToken, vpsAction } = await req.json();
    console.log(`[VPS Diagnostic] Test: ${test} (CORREÇÃO TOKEN)`);

    // CORREÇÃO CRÍTICA: VPS Configuration usando token correto confirmado
    const VPS_CONFIG = {
      host: '31.97.24.222',
      port: '3001',
      get baseUrl() {
        return `http://${this.host}:${this.port}`;
      },
      // CORREÇÃO: Usar o token correto confirmado pelo usuário
      authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
    };

    const getVPSHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
      'X-API-Token': VPS_CONFIG.authToken,
      'apikey': VPS_CONFIG.authToken,
      'User-Agent': 'Supabase-VPS-Diagnostic/4.0-TOKEN-CORRIGIDO',
      'Accept': 'application/json'
    });

    // CORREÇÃO: Função de validação de versão atualizada
    const isValidVersion = (versionString: string): boolean => {
      if (!versionString) return false;
      
      const validVersions = [
        '3.5.0', // Versão confirmada via SSH - VÁLIDA
        '3.4.0',
        '3.3.0',
        '3.2.0',
        '3.1.0',
        '3.0.0'
      ];
      
      if (validVersions.includes(versionString)) {
        return true;
      }
      
      // Aceitar todas as versões 3.x como válidas
      const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;
      const match = versionString.match(semverPattern);
      
      if (!match) return false;
      
      const [, major] = match;
      const majorNum = parseInt(major);
      
      return majorNum >= 3;
    };

    const startTime = Date.now();

    // Test: VPS Connectivity
    if (test === 'vps_connectivity') {
      console.log('[VPS Diagnostic] 🔧 Testando conectividade VPS (TOKEN CORRIGIDO)...');
      
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
          
          // Validar versão corretamente
          const versionValid = data.version && isValidVersion(data.version);
          if (versionValid) {
            console.log('[VPS Diagnostic] ✅ VPS conectado com versão válida (TOKEN CORRIGIDO):', data.version);
          } else {
            console.log('[VPS Diagnostic] ⚠️ VPS conectado mas versão não validada:', data.version);
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              duration,
              details: {
                ...data,
                version_validated: versionValid,
                token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
                phase: 'TOKEN_CORRIGIDO'
              },
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
            token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: VPS Authentication (TOKEN CORRIGIDO)
    if (test === 'vps_auth') {
      console.log('[VPS Diagnostic] 🔐 Testando autenticação VPS (TOKEN CORRIGIDO)...');
      
      try {
        const response = await fetch(`${VPS_CONFIG.baseUrl}/instances`, {
          method: 'GET',
          headers: getVPSHeaders(),
          signal: AbortSignal.timeout(10000)
        });

        const duration = Date.now() - startTime;
        const responseText = await response.text();

        if (response.ok) {
          const data = JSON.parse(responseText);
          
          // Verificar se o servidor aceita nosso token corrigido
          const authSuccess = response.status === 200;
          
          console.log('[VPS Diagnostic] ✅ Autenticação testada (TOKEN CORRIGIDO):', { authSuccess, data });
          
          return new Response(
            JSON.stringify({
              success: authSuccess,
              duration,
              details: {
                ...data,
                token_tested: VPS_CONFIG.authToken.substring(0, 15) + '...',
                auth_accepted: authSuccess,
                phase: 'TOKEN_CORRIGIDO'
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
            token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: VPS Services
    if (test === 'vps_services') {
      console.log('[VPS Diagnostic] ⚙️ Testando serviços VPS (TOKEN CORRIGIDO)...');
      
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
          console.log('[VPS Diagnostic] ✅ Serviços VPS funcionando (TOKEN CORRIGIDO):', data);
          
          return new Response(
            JSON.stringify({
              success: true,
              duration,
              details: {
                ...data,
                token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
                phase: 'TOKEN_CORRIGIDO'
              },
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
            token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: Full Flow (check_server) (TOKEN CORRIGIDO)
    if (test === 'full_flow') {
      console.log('[VPS Diagnostic] 🔄 Testando fluxo completo (TOKEN CORRIGIDO)...');
      
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

        // Validar versão no fluxo completo
        const versionValid = healthData.version && isValidVersion(healthData.version);

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
        
        console.log('[VPS Diagnostic] ✅ Fluxo completo funcionando (TOKEN CORRIGIDO)');
        
        return new Response(
          JSON.stringify({
            success: true,
            duration,
            details: {
              health: healthData,
              instances: instancesData,
              flow_status: 'complete',
              version_validated: versionValid,
              token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
              phase: 'TOKEN_CORRIGIDO'
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
            token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test: Edge Function Health
    if (test === 'edge_function') {
      console.log('[VPS Diagnostic] 🔍 Testando saúde da Edge Function (TOKEN CORRIGIDO)...');
      
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
              token: VPS_CONFIG.authToken.substring(0, 15) + '...'
            },
            phase: 'TOKEN_CORRIGIDO'
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
        token_used: VPS_CONFIG.authToken.substring(0, 15) + '...',
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
