
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
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
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const responseText = await response.text();
    console.log(`[QR Service] Response (${response.status}):`, responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // CORREÇÃO: Se resposta não é JSON válido, tentar extrair QR Code como texto
      if (responseText.includes('data:image/') || responseText.length > 100) {
        data = { qrCode: responseText.trim(), raw: true };
      } else {
        data = { raw: responseText };
      }
    }

    return { 
      success: response.ok,
      status: response.status, 
      data 
    };
  } catch (error: any) {
    console.error(`[QR Service] ❌ Request error:`, error.message);
    return { 
      success: false, 
      status: 500,
      error: error.message 
    };
  }
}

async function getQRCodeDirectFromVPS(vpsInstanceId: string) {
  console.log(`[QR Service] 🔍 BUSCA DIRETA DE QR CODE: ${vpsInstanceId}`);

  // Tentar múltiplos endpoints para encontrar QR Code
  const endpoints = [
    `/qr/${vpsInstanceId}`,
    `/instance/${vpsInstanceId}/qr`,
    `/instances/${vpsInstanceId}/qr`
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await makeVPSRequest(endpoint, 'GET');

      if (result.success && result.data?.qrCode) {
        console.log(`[QR Service] ✅ QR Code encontrado via ${endpoint}`);
        
        let qrCodeBase64 = result.data.qrCode;
        
        // Normalizar QR Code
        if (typeof qrCodeBase64 === 'string' && qrCodeBase64.length > 50) {
          if (!qrCodeBase64.startsWith('data:image/')) {
            qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
          }

          return {
            success: true,
            qrCode: qrCodeBase64,
            source: 'direct_vps',
            endpoint: endpoint
          };
        }
      }
    } catch (error) {
      console.log(`[QR Service] ⚠️ Endpoint ${endpoint} falhou:`, error.message);
    }
  }

  return {
    success: false,
    message: 'QR Code não encontrado em nenhum endpoint da VPS'
  };
}

async function handleVPSWebhook(supabase: any, webhookData: any) {
  console.log(`[QR Service] 🔔 WEBHOOK VPS RECEBIDO:`, webhookData);
  
  try {
    const { instanceId, event, data } = webhookData;
    
    if (!instanceId) {
      throw new Error('Instance ID não fornecido no webhook');
    }

    // Buscar instância no banco pelo vps_instance_id
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error(`[QR Service] ❌ Instância não encontrada:`, instanceId);
      return { success: false, error: 'Instância não encontrada' };
    }

    console.log(`[QR Service] ✅ Instância encontrada:`, instance.instance_name);

    switch (event) {
      case 'qr_code_generated':
      case 'qr.update':
      case 'qr.ready':
        if (data?.qrCode) {
          let normalizedQrCode = data.qrCode;
          if (!data.qrCode.startsWith('data:image/')) {
            normalizedQrCode = `data:image/png;base64,${data.qrCode}`;
          }

          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: normalizedQrCode,
              web_status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

          if (updateError) {
            console.error(`[QR Service] ❌ Erro ao salvar QR Code:`, updateError);
            return { success: false, error: updateError.message };
          }

          console.log(`[QR Service] ✅ QR CODE SALVO VIA WEBHOOK!`);
          return { success: true, message: 'QR Code salvo via webhook' };
        }
        break;

      case 'connection_status_changed':
      case 'connection.update':
        if (data?.status) {
          const isConnected = ['open', 'ready', 'connected'].includes(data.status.toLowerCase());
          
          const updateData: any = {
            connection_status: isConnected ? 'ready' : data.status,
            web_status: isConnected ? 'connected' : data.status,
            updated_at: new Date().toISOString()
          };

          if (isConnected) {
            updateData.qr_code = null;
            if (data.phone) {
              updateData.phone = data.phone;
            }
          }

          const { error: statusError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', instance.id);

          if (statusError) {
            console.error(`[QR Service] ❌ Erro ao atualizar status:`, statusError);
            return { success: false, error: statusError.message };
          }

          console.log(`[QR Service] ✅ Status atualizado via webhook: ${data.status}`);
          return { success: true, message: 'Status atualizado via webhook' };
        }
        break;

      default:
        console.log(`[QR Service] ℹ️ Evento ignorado:`, event);
        return { success: true, message: 'Evento ignorado' };
    }

    return { success: true, message: 'Webhook processado' };

  } catch (error: any) {
    console.error(`[QR Service] ❌ Erro no webhook:`, error);
    return { success: false, error: error.message };
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
    console.log(`[QR Service] 📥 Request:`, body);

    // CORREÇÃO: Detectar webhook da VPS vs ação manual
    if (body.instanceId && body.event && body.data) {
      console.log(`[QR Service] 🔔 PROCESSANDO WEBHOOK DA VPS`);
      const result = await handleVPSWebhook(supabase, body);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, instanceId } = body;
    console.log(`[QR Service] 🎯 Ação: ${action}, Instância: ${instanceId}`);

    // Autenticar usuário para ações manuais
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
        console.log(`[QR Service] 📱 BUSCA DIRETA DE QR para: ${instance.instance_name}`);

        // CORREÇÃO: Usar busca direta como método principal
        const qrResult = await getQRCodeDirectFromVPS(instance.vps_instance_id);
        
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

          console.log(`[QR Service] ✅ QR Code obtido via BUSCA DIRETA`);

          return new Response(
            JSON.stringify({
              success: true,
              message: 'QR Code obtido com sucesso',
              qrCode: qrResult.qrCode,
              source: qrResult.source,
              endpoint: qrResult.endpoint,
              instanceId: instanceId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              waiting: true,
              message: qrResult.message || 'QR Code não disponível ainda',
              source: 'direct_search_failed'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
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
          // Buscar QR Code diretamente da VPS
          const qrResult = await getQRCodeDirectFromVPS(instance.vps_instance_id);
          
          return new Response(
            JSON.stringify({
              success: qrResult.success,
              qrCode: qrResult.qrCode,
              source: qrResult.success ? 'vps_direct' : 'not_found',
              waiting: !qrResult.success,
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
