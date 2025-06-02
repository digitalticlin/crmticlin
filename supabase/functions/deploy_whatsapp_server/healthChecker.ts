
import { HealthCheckResult } from './types.ts';

export const healthCheckWithRetry = async (
  url: string, 
  timeout: number = 15000, 
  maxRetries: number = 3
): Promise<HealthCheckResult> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${maxRetries} para ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CRM-Deploy-Checker/2.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        let data = {};
        try {
          data = await response.json();
        } catch (e) {
          // Se não conseguir parsear JSON, considera como online se status OK
          data = { status: 'online', message: 'Service responding' };
        }
        console.log(`✅ ${url} respondeu com sucesso na tentativa ${attempt}`);
        return { online: true, data, attempt };
      }
      
      console.log(`⚠️ ${url} retornou status ${response.status} na tentativa ${attempt}`);
      if (attempt === maxRetries) {
        return { online: false, status: response.status, attempt };
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`❌ Erro na tentativa ${attempt} para ${url}:`, error.message);
      
      if (attempt === maxRetries) {
        return { online: false, error: error.message, attempt };
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return { online: false, error: 'Max retries exceeded', attempt: maxRetries };
};

export const checkServices = async (vpsHost: string, apiPort: string, whatsappPort: string) => {
  console.log('📡 Testando conectividade dos serviços com retry automático...');
  
  // Testar API Server (porta 80) com retry
  const apiResult = await healthCheckWithRetry(`http://${vpsHost}:${apiPort}/health`);
  console.log(`API Server (porta 80): ${apiResult.online ? '✅ Online' : '❌ Offline'} [Tentativas: ${apiResult.attempt}]`);
  
  // Testar WhatsApp Server (porta 3001) com retry
  const whatsappResult = await healthCheckWithRetry(`http://${vpsHost}:${whatsappPort}/health`);
  console.log(`WhatsApp Server (porta 3001): ${whatsappResult.online ? '✅ Online' : '❌ Offline'} [Tentativas: ${whatsappResult.attempt}]`);

  return { apiResult, whatsappResult };
};
