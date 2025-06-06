
import { corsHeaders, VPS_CONFIG, testVPSConnectivity } from './config.ts';

export async function getHealthStatus() {
  const healthId = `health_${Date.now()}`;
  console.log(`[Health Check] 🏥 CORREÇÃO CRÍTICA - Verificando saúde do sistema [${healthId}]`);

  try {
    // Testar conectividade VPS
    const vpsConnected = await testVPSConnectivity();
    
    const healthData = {
      success: true,
      healthId,
      timestamp: new Date().toISOString(),
      services: {
        edgeFunction: {
          status: 'online',
          version: '1.0.0'
        },
        vps: {
          status: vpsConnected ? 'online' : 'offline',
          baseUrl: VPS_CONFIG.baseUrl,
          connectivity: vpsConnected
        },
        database: {
          status: 'online', // Se chegou até aqui, o Supabase está ok
          connection: 'active'
        }
      },
      overallHealth: vpsConnected ? 'healthy' : 'degraded'
    };

    console.log(`[Health Check] ✅ CORREÇÃO CRÍTICA - Health check completo [${healthId}]:`, healthData.overallHealth);

    return new Response(
      JSON.stringify(healthData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Health Check] ❌ CORREÇÃO CRÍTICA - Erro no health check [${healthId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        healthId,
        error: error.message,
        timestamp: new Date().toISOString(),
        overallHealth: 'critical'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
