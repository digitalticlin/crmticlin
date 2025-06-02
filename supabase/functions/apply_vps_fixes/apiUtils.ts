
import { VPS_API_CONFIG } from './config.ts';
import { APIResponse } from './types.ts';

export async function executeAPICommand(
  command: string, 
  description: string,
  timeout: number = 60000
): Promise<APIResponse> {
  try {
    console.log(`🔧 Executando via API: ${description}`);
    console.log(`Command: ${command}`);
    
    const apiToken = Deno.env.get('VPS_API_TOKEN') || VPS_API_CONFIG.token;
    
    const response = await fetch(`${VPS_API_CONFIG.baseUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        command,
        description,
        timeout
      }),
      signal: AbortSignal.timeout(timeout + 5000) // Add 5s buffer
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ API sucesso: ${result.output?.substring(0, 200)}`);
      return {
        success: true,
        output: result.output || 'Comando executado com sucesso',
        duration: result.duration
      };
    } else {
      console.error(`❌ API erro: ${result.error}`);
      return {
        success: false,
        output: result.output,
        error: `API failed: ${result.error}`,
        duration: result.duration
      };
    }
    
  } catch (error: any) {
    console.error(`❌ Erro API: ${error.message}`);
    return {
      success: false,
      output: '',
      error: `Erro API: ${error.message}`
    };
  }
}

export async function testAPIConnection(): Promise<APIResponse> {
  try {
    console.log('🔍 Testando conexão com API Server...');
    
    const response = await fetch(`${VPS_API_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const status = await response.json();
    
    return {
      success: true,
      output: `API Server conectado: ${status.server} v${status.version}`
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: `Conexão API falhou: ${error.message}`
    };
  }
}
