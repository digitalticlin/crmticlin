
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Configuração VPS baseada na descoberta
const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('VPS_API_TOKEN') || 'default-token'}`
  }
};

async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { success: false, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { success: false, error: 'Invalid token' };
  }

  return { success: true, user };
}

async function makeVPSRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[VPS Request] ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: { ...VPS_CONFIG.headers, ...options.headers },
    signal: AbortSignal.timeout(30000)
  });

  const responseText = await response.text();
  console.log(`[VPS Request] Response (${response.status}):`, responseText);

  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = { raw: responseText };
  }

  return { response, data: responseData };
}

async function createInstanceOnVPS(instanceName: string) {
  console.log(`[Instance Manager] 🆕 Criando instância na VPS: ${instanceName}`);

  // Testar diferentes payloads para criação
  const payloads = [
    { instanceName },
    { instance: instanceName },
    { name: instanceName },
    { sessionName: instanceName }
  ];

  const endpoints = ['/instance/create', '/api/instance/create'];

  for (const endpoint of endpoints) {
    for (const payload of payloads) {
      try {
        console.log(`[Instance Manager] Tentando ${endpoint} com payload:`, payload);
        
        const { response, data } = await makeVPSRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log(`[Instance Manager] ✅ Sucesso com ${endpoint}:`, data);
          return {
            success: true,
            vpsInstanceId: data.instanceId || data.instance || instanceName,
            vpsResponse: data,
            endpoint: endpoint,
            payload: payload
          };
        }
      } catch (error) {
        console.log(`[Instance Manager] ❌ Erro em ${endpoint}:`, error.message);
      }
    }
  }

  throw new Error('Falha em todos os endpoints de criação testados');
}

async function getQRCodeFromVPS(vpsInstanceId: string) {
  console.log(`[Instance Manager] 🔳 Obtendo QR Code da VPS: ${vpsInstanceId}`);

  const payloads = [
    { instanceId: vpsInstanceId },
    { instance: vpsInstanceId },
    { instanceName: vpsInstanceId }
  ];

  const endpoints = ['/instance/qr', '/api/instance/qr', '/instance/qrcode', '/api/qr'];

  for (const endpoint of endpoints) {
    for (const payload of payloads) {
      try {
        console.log(`[Instance Manager] Tentando ${endpoint} com payload:`, payload);
        
        const { response, data } = await makeVPSRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (response.ok && (data.qrCode || data.qr || data.base64)) {
          const qrCode = data.qrCode || data.qr || data.base64;
          console.log(`[Instance Manager] ✅ QR Code obtido com ${endpoint}`);
          return {
            success: true,
            qrCode: qrCode,
            vpsResponse: data
          };
        }
      } catch (error) {
        console.log(`[Instance Manager] ❌ Erro em ${endpoint}:`, error.message);
      }
    }
  }

  return {
    success: false,
    waiting: true,
    message: 'QR Code ainda não disponível'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    console.log(`[Instance Manager] 🎯 Processando ação: ${action}`);

    // Autenticar usuário
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    switch (action) {
      case 'create_instance': {
        const { instanceName } = body;
        
        if (!instanceName) {
          return new Response(
            JSON.stringify({ success: false, error: 'Nome da instância é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Instance Manager] 📱 ETAPA 1: Criando instância ${instanceName}`);

        // Criar na VPS primeiro
        const vpsResult = await createInstanceOnVPS(instanceName);
        
        // Salvar no banco de dados
        const { data: dbInstance, error: dbError } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: instanceName,
            vps_instance_id: vpsResult.vpsInstanceId,
            connection_status: 'created',
            web_status: 'waiting_qr',
            connection_type: 'web',
            created_by_user_id: user.id,
            company_id: null // Será definido depois
          })
          .select()
          .single();

        if (dbError) {
          console.error('[Instance Manager] ❌ Erro no banco:', dbError);
          throw new Error(`Erro no banco de dados: ${dbError.message}`);
        }

        console.log(`[Instance Manager] ✅ Instância criada - DB ID: ${dbInstance.id}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Instância criada com sucesso',
            instance: {
              id: dbInstance.id,
              instance_name: instanceName,
              vps_instance_id: vpsResult.vpsInstanceId,
              connection_status: 'created',
              web_status: 'waiting_qr',
              created_at: dbInstance.created_at
            },
            vpsDetails: vpsResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'generate_qr': {
        const { instanceId } = body;
        
        if (!instanceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'ID da instância é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[Instance Manager] 🔳 ETAPA 2: Gerando QR Code para ${instanceId}`);

        // Buscar instância no banco
        const { data: instance, error: fetchError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('id', instanceId)
          .eq('created_by_user_id', user.id)
          .single();

        if (fetchError || !instance) {
          return new Response(
            JSON.stringify({ success: false, error: 'Instância não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Obter QR Code da VPS
        const qrResult = await getQRCodeFromVPS(instance.vps_instance_id);
        
        if (qrResult.success) {
          // Atualizar instância com QR Code
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: qrResult.qrCode,
              web_status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);

          if (updateError) {
            console.error('[Instance Manager] ❌ Erro ao atualizar QR:', updateError);
          }

          console.log(`[Instance Manager] ✅ QR Code gerado e salvo`);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'QR Code gerado com sucesso',
              qrCode: qrResult.qrCode,
              instanceId: instanceId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              waiting: qrResult.waiting,
              message: qrResult.message || 'QR Code não disponível ainda'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação não reconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Instance Manager] ❌ Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
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
