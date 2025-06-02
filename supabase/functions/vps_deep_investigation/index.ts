
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VPS_BASE_URL = 'http://31.97.24.222:3001';

interface TestRequest {
  method: string;
  endpoint: string;
  payload: any;
  contentType: string;
  testId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, endpoint, payload, contentType, testId }: TestRequest = await req.json();
    
    console.log(`[Deep Investigation] Test ${testId}: ${method} ${endpoint}`);
    console.log(`[Deep Investigation] Content-Type: ${contentType}`);
    console.log(`[Deep Investigation] Payload:`, payload);

    const url = `${VPS_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': 'Bearer default-token',
      'User-Agent': 'Lovable-Deep-Investigation/1.0',
      'Accept': '*/*',
      'Connection': 'keep-alive'
    };

    // Configurar Content-Type e corpo da requisição baseado no tipo
    let body: string | FormData | undefined;
    
    if (method !== 'GET' && payload !== null && payload !== undefined) {
      switch (contentType) {
        case 'application/json':
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(payload);
          break;
          
        case 'application/x-www-form-urlencoded':
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          if (typeof payload === 'object') {
            const params = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
              params.append(key, String(value));
            });
            body = params.toString();
          } else {
            body = String(payload);
          }
          break;
          
        case 'multipart/form-data':
          // Não definir Content-Type manualmente para FormData
          const formData = new FormData();
          if (typeof payload === 'object') {
            Object.entries(payload).forEach(([key, value]) => {
              formData.append(key, String(value));
            });
            body = formData;
          }
          break;
          
        case 'text/plain':
          headers['Content-Type'] = 'text/plain';
          body = typeof payload === 'string' ? payload : JSON.stringify(payload);
          break;
          
        default:
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(payload);
      }
    }

    console.log(`[Deep Investigation] Final URL: ${url}`);
    console.log(`[Deep Investigation] Final Headers:`, headers);
    console.log(`[Deep Investigation] Final Body:`, body);

    let response: Response;
    let responseData: any;
    let success = false;

    try {
      // Fazer a requisição com timeout de 10 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      response = await fetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`[Deep Investigation] Response Status: ${response.status} ${response.statusText}`);
      console.log(`[Deep Investigation] Response Headers:`, Object.fromEntries(response.headers.entries()));

      // Tentar ler a resposta como JSON primeiro, depois como texto
      const responseText = await response.text();
      console.log(`[Deep Investigation] Raw Response:`, responseText);

      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      success = response.ok;

    } catch (fetchError) {
      console.error(`[Deep Investigation] Fetch Error:`, fetchError);
      responseData = {
        error: fetchError.message,
        type: fetchError.name,
        details: 'Network or timeout error'
      };
      response = { status: 0, statusText: 'Network Error' } as Response;
    }

    // Análise adicional para códigos de status específicos
    let analysis = '';
    if (response.status === 404) {
      analysis = 'Endpoint não encontrado - pode estar em path diferente';
    } else if (response.status === 405) {
      analysis = 'Método HTTP não permitido - tentar outro método';
    } else if (response.status === 400) {
      analysis = 'Bad Request - formato do payload pode estar incorreto';
    } else if (response.status === 401) {
      analysis = 'Não autorizado - problemas de autenticação';
    } else if (response.status === 500) {
      analysis = 'Erro interno do servidor - pode ser problema de configuração';
    } else if (response.status >= 200 && response.status < 300) {
      analysis = 'Sucesso! Este método/payload funcionou';
      success = true;
    }

    const result = {
      success,
      statusCode: response.status,
      statusText: response.statusText,
      response: responseData,
      analysis,
      testDetails: {
        testId,
        url,
        method,
        endpoint,
        payload,
        contentType,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[Deep Investigation] Final Result:`, result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[Deep Investigation] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Investigation function error'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
