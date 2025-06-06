
import { corsHeaders } from './config.ts';
import { testVPSConnectivity } from './vpsRequestService.ts';

export async function getHealthStatus() {
  const healthId = `health_${Date.now()}`;
  console.log(`[Health Service] 🏥 CORREÇÃO ROBUSTA - Verificando saúde do sistema [${healthId}]`);

  try {
    const startTime = Date.now();
    
    // Testar conectividade VPS
    console.log('[Health Service] 🔍 CORREÇÃO - Testando VPS...');
    const vpsConnected = await testVPSConnectivity();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const healthData = {
      status: vpsConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      vps: {
        connected: vpsConnected,
        url: 'http://31.97.24.222:3001',
        token: 'default-token'
      },
      edgeFunction: {
        status: 'running',
        version: '2.0.0-robusta'
      }
    };

    console.log(`[Health Service] ✅ CORREÇÃO - Health check concluído [${healthId}]:`, healthData);

    return new Response(
      JSON.stringify(healthData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        } 
      }
    );

  } catch (error: any) {
    console.error(`[Health Service] ❌ CORREÇÃO - Erro no health check [${healthId}]:`, error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        healthId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
