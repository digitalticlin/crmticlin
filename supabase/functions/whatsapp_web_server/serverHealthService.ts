
import { VPS_CONFIG } from './config.ts';
import { createVPSRequest } from './vpsRequestService.ts';

export async function checkServerHealth(supabase: any) {
  console.log('[Server Health] 🩺 Verificando saúde do servidor VPS');
  
  try {
    const result = await createVPSRequest('/health', 'GET');
    
    if (result.success && result.data) {
      console.log('[Server Health] ✅ Servidor VPS saudável:', result.data);
      
      return {
        success: true,
        status: 'healthy',
        vps_info: result.data,
        server_url: VPS_CONFIG.baseUrl,
        timestamp: new Date().toISOString()
      };
    } else {
      console.error('[Server Health] ❌ Servidor VPS com problemas:', result.error);
      
      return {
        success: false,
        status: 'unhealthy',
        error: result.error,
        server_url: VPS_CONFIG.baseUrl,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error: any) {
    console.error('[Server Health] ❌ Erro ao verificar saúde:', error);
    
    return {
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export async function getServerInfo(supabase: any) {
  console.log('[Server Info] ℹ️ Obtendo informações do servidor');
  
  try {
    const healthResult = await checkServerHealth(supabase);
    
    if (healthResult.success) {
      // Obter instâncias do VPS
      const instancesResult = await createVPSRequest('/instances', 'GET');
      
      return {
        success: true,
        server_info: healthResult.vps_info,
        instances: instancesResult.success ? instancesResult.data : null,
        server_url: VPS_CONFIG.baseUrl,
        timestamp: new Date().toISOString()
      };
    } else {
      return healthResult;
    }
  } catch (error: any) {
    console.error('[Server Info] ❌ Erro ao obter informações:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
