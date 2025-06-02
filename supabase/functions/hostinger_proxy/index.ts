
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[VPS Proxy] Iniciando requisição para VPS direta');

    const url = new URL(req.url);
    // Remover o prefix /functions/v1/hostinger_proxy da URL
    const path = url.pathname.replace('/functions/v1/hostinger_proxy', '');
    const method = req.method;

    console.log(`[VPS Proxy] ${method} ${path}`);

    // Configurar URL da VPS direta (usando a URL correta fornecida)
    const vpsBaseUrl = 'http://31.97.24.222';
    let vpsUrl = `${vpsBaseUrl}${path}`;

    console.log(`[VPS Proxy] URL da VPS: ${vpsUrl}`);

    // Headers simplificados para VPS direta (sem Bearer token por enquanto)
    const vpsHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Ticlin-VPS-Manager/1.0'
    };

    let requestBody = null;
    if (method === 'POST' && req.body) {
      requestBody = await req.text();
      console.log(`[VPS Proxy] Request body: ${requestBody.substring(0, 200)}...`);
    }

    console.log(`[VPS Proxy] Fazendo requisição para VPS: ${vpsUrl}`);
    console.log(`[VPS Proxy] Headers: ${JSON.stringify(vpsHeaders, null, 2)}`);

    // Fazer requisição para VPS direta com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const vpsResponse = await fetch(vpsUrl, {
        method,
        headers: vpsHeaders,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await vpsResponse.text();
      console.log(`[VPS Proxy] Status: ${vpsResponse.status}`);
      console.log(`[VPS Proxy] Response headers: ${JSON.stringify([...vpsResponse.headers.entries()])}`);
      console.log(`[VPS Proxy] Response: ${responseText.substring(0, 500)}...`);

      if (!vpsResponse.ok) {
        let errorMessage = `VPS retornou erro ${vpsResponse.status}`;
        
        // Melhorar mensagens de erro específicas
        switch (vpsResponse.status) {
          case 401:
            errorMessage = 'Acesso não autorizado à VPS';
            break;
          case 403:
            errorMessage = 'Acesso negado pela VPS';
            break;
          case 404:
            errorMessage = 'Endpoint não encontrado na VPS';
            break;
          case 429:
            errorMessage = 'Limite de requisições excedido na VPS';
            break;
          case 500:
            errorMessage = 'Erro interno na VPS';
            break;
          case 502:
            errorMessage = 'VPS indisponível (Bad Gateway)';
            break;
          case 503:
            errorMessage = 'VPS temporariamente indisponível';
            break;
          case 504:
            errorMessage = 'Timeout na conexão com a VPS';
            break;
          default:
            errorMessage += `: ${responseText}`;
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage,
            status_code: vpsResponse.status,
            raw_response: responseText.substring(0, 500)
          }),
          { 
            status: vpsResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Tentar fazer parse do JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.log('[VPS Proxy] Resposta não é JSON, tratando como texto');
        // Se não for JSON válido, retornar como texto
        responseData = {
          output: responseText,
          raw_response: responseText
        };
      }

      // Retornar resposta formatada
      return new Response(
        JSON.stringify({ success: true, data: responseData }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[VPS Proxy] Timeout na requisição');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Timeout na conexão com a VPS',
            code: 'TIMEOUT'
          }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('[VPS Proxy] Erro:', error);
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
