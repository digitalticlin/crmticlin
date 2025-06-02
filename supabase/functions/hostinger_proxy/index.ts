
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HostingerVPS {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  ip_address: string;
  cpu_cores: number;
  memory: number;
  storage: number;
  os: string;
  created_at: string;
}

interface CommandRequest {
  vpsId: string;
  command: string;
  description?: string;
}

// URLs da VPS com porta 80 especificada
const VPS_URLS = [
  'http://31.97.24.222:80',
  'http://srv848330.hstgr.cloud:80'
];

const VPS_TIMEOUT = 8000; // 8 segundos para testes rápidos

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Proxy] Iniciando requisição para VPS na porta 80');

    const url = new URL(req.url);
    const path = url.pathname.replace('/functions/v1/hostinger_proxy', '');
    const method = req.method;

    console.log(`[VPS Proxy] ${method} ${path}`);

    let requestBody = null;
    if (method === 'POST' && req.body) {
      requestBody = await req.text();
      console.log(`[VPS Proxy] Request body: ${requestBody.substring(0, 200)}...`);
    }

    // Tentar cada URL da VPS até encontrar uma que funcione
    let lastError = null;
    
    for (const baseUrl of VPS_URLS) {
      const vpsUrl = `${baseUrl}${path}`;
      console.log(`[VPS Proxy] Tentando conectar na porta 80: ${vpsUrl}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), VPS_TIMEOUT);

        const vpsHeaders = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Ticlin-VPS-Manager/1.0'
        };

        const vpsResponse = await fetch(vpsUrl, {
          method,
          headers: vpsHeaders,
          body: requestBody,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseText = await vpsResponse.text();
        console.log(`[VPS Proxy] ${baseUrl} - Status: ${vpsResponse.status}`);

        if (!vpsResponse.ok) {
          // Se não for sucesso, tentar próxima URL
          lastError = `VPS ${baseUrl} retornou erro ${vpsResponse.status}`;
          console.log(`[VPS Proxy] ${lastError}, tentando próxima URL...`);
          continue;
        }

        // Sucesso! Processar resposta
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('[VPS Proxy] Resposta não é JSON, tratando como texto');
          responseData = {
            output: responseText,
            raw_response: responseText,
            server_url: baseUrl
          };
        }

        console.log(`[VPS Proxy] Sucesso com ${baseUrl} na porta 80`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: responseData,
            server_used: baseUrl
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          lastError = `Timeout na conexão com ${baseUrl} na porta 80`;
          console.log(`[VPS Proxy] ${lastError}`);
        } else {
          lastError = `Erro de rede com ${baseUrl}: ${fetchError.message}`;
          console.log(`[VPS Proxy] ${lastError}`);
        }
        
        // Continuar para próxima URL
        continue;
      }
    }

    // Se chegou aqui, todas as URLs falharam
    console.error('[VPS Proxy] Todas as URLs da VPS na porta 80 falharam');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: lastError || 'Servidor não está rodando na porta 80 ou firewall está bloqueando',
        code: 'PORT_80_NOT_ACCESSIBLE',
        attempted_servers: VPS_URLS,
        suggestion: 'Verifique se o servidor está rodando na porta 80 e se o firewall permite conexões'
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[VPS Proxy] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
