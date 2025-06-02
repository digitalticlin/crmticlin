
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
    const API_TOKEN = Deno.env.get('HOSTINGER_API_TOKEN');
    if (!API_TOKEN) {
      console.error('❌ HOSTINGER_API_TOKEN não encontrado nos secrets');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token da API Hostinger não configurado nos Supabase Secrets',
          code: 'MISSING_TOKEN'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Token da API Hostinger encontrado');

    const url = new URL(req.url);
    const path = url.pathname.replace('/functions/v1/hostinger_proxy', '');
    const method = req.method;

    console.log(`[Hostinger Proxy] ${method} ${path}`);

    // Configurar URL da API Hostinger
    const hostingerBaseUrl = 'https://api.hostinger.com/vps/v1';
    let hostingerUrl = `${hostingerBaseUrl}${path}`;

    // Headers para API Hostinger
    const hostingerHeaders = {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Ticlin-VPS-Manager/1.0'
    };

    let requestBody = null;
    if (method === 'POST' && req.body) {
      requestBody = await req.text();
      console.log(`[Hostinger Proxy] Request body: ${requestBody.substring(0, 200)}...`);
    }

    console.log(`[Hostinger Proxy] Fazendo requisição para: ${hostingerUrl}`);
    console.log(`[Hostinger Proxy] Headers: ${JSON.stringify(hostingerHeaders, null, 2)}`);

    // Fazer requisição para API Hostinger com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const hostingerResponse = await fetch(hostingerUrl, {
        method,
        headers: hostingerHeaders,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await hostingerResponse.text();
      console.log(`[Hostinger Proxy] Status: ${hostingerResponse.status}`);
      console.log(`[Hostinger Proxy] Response headers: ${JSON.stringify([...hostingerResponse.headers.entries()])}`);
      console.log(`[Hostinger Proxy] Response: ${responseText.substring(0, 500)}...`);

      if (!hostingerResponse.ok) {
        let errorMessage = `API Hostinger retornou erro ${hostingerResponse.status}`;
        
        // Melhorar mensagens de erro específicas
        switch (hostingerResponse.status) {
          case 401:
            errorMessage = 'Token da API Hostinger inválido ou expirado';
            break;
          case 403:
            errorMessage = 'Acesso negado - verifique as permissões do token';
            break;
          case 404:
            errorMessage = 'Endpoint não encontrado na API Hostinger';
            break;
          case 429:
            errorMessage = 'Limite de requisições excedido - tente novamente em alguns minutos';
            break;
          case 500:
            errorMessage = 'Erro interno na API Hostinger';
            break;
          default:
            errorMessage += `: ${responseText}`;
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: errorMessage,
            status_code: hostingerResponse.status,
            raw_response: responseText.substring(0, 500)
          }),
          { 
            status: hostingerResponse.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Tentar fazer parse do JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Hostinger Proxy] Erro ao fazer parse do JSON:', parseError);
        console.error('[Hostinger Proxy] Response text:', responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Resposta inválida da API Hostinger - não é JSON válido',
            raw_response: responseText.substring(0, 500)
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        console.error('[Hostinger Proxy] Timeout na requisição');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Timeout na conexão com a API Hostinger',
            code: 'TIMEOUT'
          }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('[Hostinger Proxy] Erro:', error);
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
