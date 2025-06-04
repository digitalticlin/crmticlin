
// VPS Configuration for WhatsApp Web.js Server - UNIFIED CONFIG FASE 1
export const VPS_CONFIG = {
  // Primary VPS server URL
  baseUrl: 'http://31.97.24.222:3001',
  host: '31.97.24.222',
  port: 3001,
  
  // Timeouts and retry configuration - MELHORADOS
  timeout: 20000, // Aumentado de 15s para 20s
  retries: 5, // Aumentado de 3 para 5
  retryDelay: 2000, // 2 segundos entre tentativas
  
  // Authentication token for VPS API - VALIDADO
  authToken: 'default-token',
  
  // Health check endpoints - VALIDADOS
  healthEndpoints: {
    health: '/health',
    status: '/status'
  },
  
  // Instance management endpoints - CORRIGIDOS E VALIDADOS
  endpoints: {
    create: '/instance/create',
    delete: '/instance/delete', 
    qr: '/instance/qr',
    status: '/instance/status',
    instances: '/instances',
    health: '/health',
    // NOVOS endpoints para melhor integração
    restart: '/instance/restart',
    info: '/instance/info'
  },

  // NOVO: Configurações de sincronização estabilizada
  sync: {
    interval: 180000, // 3 minutos ao invés de 30 segundos
    debounceDelay: 5000, // 5 segundos de debounce
    maxRetries: 3,
    healthCheckInterval: 60000 // 1 minuto
  }
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

// Helper function to create request headers - MELHORADOS
export const getRequestHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
  'User-Agent': 'Supabase-WhatsApp-Integration/1.0',
  'Accept': 'application/json'
});

// NOVO: Retry logic melhorada
export const makeVPSRequestWithRetry = async (url: string, options: RequestInit, customRetries?: number): Promise<Response> => {
  const maxRetries = customRetries || VPS_CONFIG.retries;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[VPS] Tentativa ${attempt}/${maxRetries} para: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getRequestHeaders(),
          ...options.headers
        },
        signal: AbortSignal.timeout(VPS_CONFIG.timeout)
      });

      // Se resposta OK, retornar imediatamente
      if (response.ok) {
        console.log(`[VPS] ✅ Sucesso na tentativa ${attempt}`);
        return response;
      }

      // Se erro 4xx, não tentar novamente (erro de configuração)
      if (response.status >= 400 && response.status < 500) {
        console.error(`[VPS] ❌ Erro 4xx na tentativa ${attempt}: ${response.status}`);
        return response;
      }

      // Para erros 5xx, tentar novamente
      console.warn(`[VPS] ⚠️ Erro ${response.status} na tentativa ${attempt}, tentando novamente...`);
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      console.error(`[VPS] ❌ Erro na tentativa ${attempt}:`, error);
      lastError = error as Error;
      
      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < maxRetries) {
        const delay = VPS_CONFIG.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[VPS] ⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[VPS] 💥 Todas as ${maxRetries} tentativas falharam`);
  throw lastError!;
};

// Payload builder para instance creation - MELHORADO
export const buildInstancePayload = (instanceData: any) => {
  const payload = {
    instanceId: instanceData.instanceId || instanceData.vpsInstanceId,
    sessionName: instanceData.instanceName,
    webhookUrl: instanceData.webhookUrl || `${process.env.SUPABASE_URL || 'https://kigyebrhfoljnydfipcr.supabase.co'}/functions/v1/webhook_whatsapp_web`,
    companyId: instanceData.companyId,
    // NOVOS campos para melhor rastreamento
    metadata: {
      source: 'supabase',
      version: '1.0',
      created: new Date().toISOString()
    }
  };

  console.log('[VPS Config] Payload criado:', JSON.stringify(payload, null, 2));
  return payload;
};

// NOVO: Validador de saúde da VPS
export const validateVPSHealth = async (): Promise<{healthy: boolean, error?: string}> => {
  try {
    const response = await makeVPSRequestWithRetry(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET'
    }, 2); // Apenas 2 tentativas para health check

    if (response.ok) {
      const data = await response.json();
      console.log('[VPS Health] ✅ VPS saudável:', data);
      return { healthy: true };
    } else {
      const error = `VPS Health Check falhou: ${response.status}`;
      console.error('[VPS Health] ❌', error);
      return { healthy: false, error };
    }
  } catch (error) {
    const errorMsg = `VPS inacessível: ${error.message}`;
    console.error('[VPS Health] 💥', errorMsg);
    return { healthy: false, error: errorMsg };
  }
};

console.log('[VPS Config] Configuração Fase 1 carregada');
console.log('[VPS Config] Base URL:', VPS_CONFIG.baseUrl);
console.log('[VPS Config] Sync Interval:', VPS_CONFIG.sync.interval, 'ms');
console.log('[VPS Config] Retry Config:', { retries: VPS_CONFIG.retries, delay: VPS_CONFIG.retryDelay });
