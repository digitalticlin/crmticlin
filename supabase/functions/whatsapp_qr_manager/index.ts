
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO VPS PADRONIZADA
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL')!,
  authToken: Deno.env.get('VPS_API_TOKEN') ?? '',
  timeout: Number(Deno.env.get('VPS_TIMEOUT_MS') ?? '60000')
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    console.log('[QR Manager] 🚀 Iniciando processamento - VERSÃO CORRIGIDA');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ✅ AUTENTICAÇÃO OBRIGATÓRIA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[QR Manager] ❌ Token de autorização ausente ou malformado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório (Bearer token)'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ CLIENTE SUPABASE COM RLS PARA VALIDAÇÃO
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // ✅ VALIDAÇÃO DO USUÁRIO ATUAL
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('[QR Manager] ❌ Usuário não autenticado:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não autenticado'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ VERIFICAÇÃO DE TOKEN VPS
    if (!VPS_CONFIG.authToken) {
      console.error('[QR Manager] ❌ VPS_API_TOKEN não configurado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração VPS incompleta - token não encontrado'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ CLIENTE SERVICE ROLE PARA OPERAÇÕES PRIVILEGIADAS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { instanceId } = await req.json();
    console.log(`🔄 [QR Manager] Solicitando QR Code para instância: ${instanceId}`);

    if (!instanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "ID da instância é obrigatório" 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // ✅ BUSCAR INSTÂNCIA VERIFICANDO PROPRIEDADE DO USUÁRIO
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', user.id)
      .single();

    if (fetchError || !instance) {
      console.error("❌ [QR Manager] Instância não encontrada para o usuário:", {
        instanceId,
        userId: user.id,
        error: fetchError?.message
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada ou não pertence ao usuário" 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 404 
      });
    }

    console.log(`🌐 [QR Manager] Solicitando QR Code para VPS: ${instance.instance_name} (${instance.vps_instance_id})`);

    // ✅ REQUISIÇÃO VPS PADRONIZADA
    const vpsEndpoint = `${VPS_CONFIG.baseUrl}/instance/${instance.vps_instance_id}/qr`;
    console.log(`🎯 [QR Manager] Endpoint VPS: ${vpsEndpoint}`);

    const response = await fetch(vpsEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'x-api-token': VPS_CONFIG.authToken,
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    const vpsResult = await response.json();
    console.log(`📱 [QR Manager] Resposta da VPS:`, vpsResult);

    // Aceitar diferentes formatos do campo de QR Code enviados pela VPS
    if (response.ok && (vpsResult.qr || vpsResult.qrcode || vpsResult.qrCode)) {
      const qrCode = vpsResult.qr || vpsResult.qrcode || vpsResult.qrCode;
      // Atualizar instância com QR Code
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrCode,
          connection_status: 'waiting_qr',
          web_status: 'qr_ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error("❌ [QR Manager] Erro ao atualizar QR Code:", updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: updateError.message 
        }), { 
          headers: corsHeaders, 
          status: 500 
        });
      }

      console.log(`✅ [QR Manager] QR Code obtido e salvo: ${instanceId}`);

      return new Response(JSON.stringify({
        success: true,
        qrCode: qrCode,
        message: "QR Code obtido com sucesso"
      }), { headers: corsHeaders });
    }

    // Se não tem QR Code, verificar se já está conectado
    if (vpsResult.state === 'open' || vpsResult.connected) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'connected',
          web_status: 'connected',
          date_connected: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (!updateError) {
        console.log(`✅ [QR Manager] Instância já conectada: ${instanceId}`);
        return new Response(JSON.stringify({
          success: true,
          connected: true,
          message: "Instância já está conectada"
        }), { headers: corsHeaders });
      }
    }

    console.log(`⏳ [QR Manager] QR Code ainda não disponível: ${instanceId}`);
    return new Response(JSON.stringify({
      success: false,
      waiting: true,
      message: "QR Code ainda não está disponível"
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ [QR Manager] Erro geral:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor" 
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
