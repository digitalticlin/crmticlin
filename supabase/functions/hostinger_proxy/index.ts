
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
      console.error('HOSTINGER_API_TOKEN não encontrado');
      return new Response(
        JSON.stringify({ success: false, error: 'Token da API não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      'Accept': 'application/json'
    };

    let requestBody = null;
    if (method === 'POST' && req.body) {
      requestBody = await req.text();
    }

    console.log(`[Hostinger Proxy] Fazendo requisição para: ${hostingerUrl}`);

    // Fazer requisição para API Hostinger
    const hostingerResponse = await fetch(hostingerUrl, {
      method,
      headers: hostingerHeaders,
      body: requestBody
    });

    const responseText = await hostingerResponse.text();
    console.log(`[Hostinger Proxy] Status: ${hostingerResponse.status}`);
    console.log(`[Hostinger Proxy] Response: ${responseText.substring(0, 500)}...`);

    if (!hostingerResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `API Hostinger retornou erro ${hostingerResponse.status}: ${responseText}` 
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
    } catch (error) {
      console.error('[Hostinger Proxy] Erro ao fazer parse do JSON:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Resposta inválida da API Hostinger' }),
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

  } catch (error: any) {
    console.error('[Hostinger Proxy] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
