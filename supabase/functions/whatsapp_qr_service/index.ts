
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  timeout: 15000
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

async function makeVPSRequest(endpoint: string, method: string = 'GET') {
  const url = `${VPS_CONFIG.baseUrl}${endpoint}`;
  console.log(`[QR Service] ${method} ${url}`);
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VPS_CONFIG.authToken}`
    },
    signal: AbortSignal.timeout(VPS_CONFIG.timeout)
  });

  const responseText = await response.text();
  console.log(`[QR Service] Response (${response.status}):`, responseText.substring(0, 100));

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  return { response, data };
}

async function getQRCodeFromVPS(vpsInstanceId: string) {
  console.log(`[QR Service] 📱 Obtendo QR Code da VPS: ${vpsInstanceId}`);

  try {
    const { response, data } = await makeVPSRequest(`/instance/${vpsInstanceId}/qr`, 'GET');

    if (response.ok && data.success) {
      console.log(`[QR Service] ✅ QR Code obtido:`, {
        hasQRCode: !!data.qrCode,
        status: data.status,
        qrLength: data.qrCode ? data.qrCode.length : 0
      });

      if (data.qrCode) {
        let qrCodeBase64 = data.qrCode;
        
        // Normalizar para formato Base64 se necessário
        if (!data.qrCode.startsWith('data:image/')) {
          console.log(`[QR Service] 🔄 Normalizando QR Code para Base64`);
          qrCodeBase64 = `data:image/png;base64,${data.qrCode}`;
        }

        return {
          success: true,
          qrCode: qrCodeBase64,
          status: data.status,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          waiting: true,
          message: 'QR Code ainda não disponível',
          status: data.status
        };
      }
    } else {
      throw new Error(data.message || 'Falha ao obter QR Code da VPS');
    }
  } catch (error: any) {
    console.error(`[QR Service] ❌ Erro ao obter QR Code:`, error.message);
    return {
      success: false,
      waiting: true,
      message: 'QR Code ainda sendo gerado',
      error: error.message
    };
  }
}

async function checkConnectionStatus(vpsInstanceId: string) {
  console.log(`[QR Service] 🔍 Verificando status de conexão: ${vpsInstanceId}`);

  try {
    const { response, data } = await makeVPSRequest(`/instance/${vpsInstanceId}/status`, 'GET');

    if (response.ok) {
      const connectionStatus = data.status || data.connectionStatus || 'unknown';
      const isConnected = ['open', 'ready', 'connected'].includes(connectionStatus.toLowerCase());
      
      console.log(`[QR Service] 📊 Status: ${connectionStatus}, Conectado: ${isConnected}`);
      
      return {
        success: true,
        connected: isConnected,
        status: connectionStatus,
        details: data
      };
    } else {
      return {
        success: false,
        connected: false,
        status: 'unknown',
        error: data.message || 'Falha ao verificar status'
      };
    }
  } catch (error: any) {
    console.error(`[QR Service] ❌ Erro ao verificar status:`, error.message);
    return {
      success: false,
      connected: false,
      status: 'error',
      error: error.message
    };
  }
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
    const { action, instanceId } = body;

    console.log(`[QR Service] 🎯 Ação: ${action}, Instância: ${instanceId}`);

    // Autenticar usuário
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user } = authResult;

    if (!instanceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID da instância é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    switch (action) {
      case 'generate_qr': {
        console.log(`[QR Service] 📱 Gerando QR Code para: ${instance.instance_name}`);

        // Obter QR Code da VPS
        const qrResult = await getQRCodeFromVPS(instance.vps_instance_id);
        
        if (qrResult.success && qrResult.qrCode) {
          // Salvar QR Code no banco
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: qrResult.qrCode,
              web_status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);

          if (updateError) {
            console.error('[QR Service] ❌ Erro ao salvar QR:', updateError);
          }

          console.log(`[QR Service] ✅ QR Code gerado e salvo`);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'QR Code gerado com sucesso',
              qrCode: qrResult.qrCode,
              instanceId: instanceId,
              timestamp: qrResult.timestamp
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              waiting: qrResult.waiting,
              message: qrResult.message || 'QR Code não disponível ainda',
              status: qrResult.status
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'check_status': {
        console.log(`[QR Service] 🔍 Verificando status para: ${instance.instance_name}`);

        const statusResult = await checkConnectionStatus(instance.vps_instance_id);
        
        if (statusResult.success && statusResult.connected) {
          // Atualizar status no banco
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              connection_status: 'ready',
              web_status: 'connected',
              qr_code: null, // Limpar QR Code após conexão
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId);

          if (updateError) {
            console.error('[QR Service] ❌ Erro ao atualizar status:', updateError);
          }

          console.log(`[QR Service] ✅ Instância conectada com sucesso`);
        }

        return new Response(
          JSON.stringify({
            success: statusResult.success,
            connected: statusResult.connected,
            status: statusResult.status,
            message: statusResult.connected ? 'WhatsApp conectado com sucesso' : 'Aguardando conexão',
            details: statusResult.details
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_qr': {
        // Retornar QR Code salvo no banco ou buscar novo da VPS
        if (instance.qr_code) {
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: instance.qr_code,
              source: 'database',
              instanceId: instanceId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Buscar novo QR Code da VPS
          const qrResult = await getQRCodeFromVPS(instance.vps_instance_id);
          
          return new Response(
            JSON.stringify({
              success: qrResult.success,
              qrCode: qrResult.qrCode,
              source: 'vps',
              waiting: qrResult.waiting,
              message: qrResult.message,
              instanceId: instanceId
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
    console.error('[QR Service] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
