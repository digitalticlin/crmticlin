
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO LIMPA DA VPS
const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1',
  timeout: 30000
};

serve(async (req) => {
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Messaging Service] 🚀 Iniciando processamento de mensagem');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO MELHORADA
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Messaging Service] ❌ Token de autorização ausente ou malformado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorização obrigatório (Bearer token)'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ CLIENTE SUPABASE COM RLS PARA VALIDAÇÃO
    const userToken = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // ✅ VALIDAÇÃO ROBUSTA DO USUÁRIO
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(userToken);
    
    if (userError || !user) {
      console.error('[Messaging Service] ❌ Falha na autenticação:', {
        error: userError?.message,
        hasUser: !!user
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Token inválido, expirado ou usuário não encontrado'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ PARSING SEGURO DO BODY
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[Messaging Service] ❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Corpo da requisição deve ser JSON válido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, instanceId, phone, message } = requestBody;

    // ✅ VALIDAÇÃO DE PARÂMETROS
    if (action !== 'send_message') {
      return new Response(JSON.stringify({
        success: false,
        error: `Ação '${action}' não reconhecida. Use 'send_message'`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!instanceId || !phone || !message) {
      console.error('[Messaging Service] ❌ Parâmetros obrigatórios ausentes:', {
        hasInstanceId: !!instanceId,
        hasPhone: !!phone,
        hasMessage: !!message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Parâmetros obrigatórios: instanceId, phone, message'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Messaging Service] 📤 Processando envio de mensagem:', {
      instanceId,
      phone: phone.substring(0, 4) + '****',
      messageLength: message.length,
      userId: user.id,
      userEmail: user.email
    });

    // ✅ VERIFICAÇÃO DE PROPRIEDADE DA INSTÂNCIA COM RLS
    const { data: instanceData, error: instanceError } = await supabaseUser
      .from('whatsapp_instances')
      .select('vps_instance_id, instance_name, connection_status')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instanceData) {
      console.error('[Messaging Service] ❌ Instância não encontrada ou acesso negado:', {
        instanceId,
        userId: user.id,
        error: instanceError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Instância não encontrada ou você não tem permissão para usá-la'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ RLS JÁ GARANTE QUE USUÁRIO TEM ACESSO - REMOVER VERIFICAÇÃO DUPLICADA

    // ✅ VERIFICAR STATUS DA INSTÂNCIA
    const connectedStatuses = ['connected', 'ready', 'open'];
    if (!connectedStatuses.includes(instanceData.connection_status?.toLowerCase())) {
      console.warn('[Messaging Service] ⚠️ Instância não está conectada:', {
        instanceId,
        currentStatus: instanceData.connection_status,
        requiredStatuses: connectedStatuses
      });
      return new Response(JSON.stringify({
        success: false,
        error: `Instância não está conectada. Status atual: ${instanceData.connection_status}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vpsInstanceId = instanceData.vps_instance_id;
    
    console.log('[Messaging Service] 🔒 Acesso autorizado - Enviando para VPS:', {
      supabaseInstanceId: instanceId,
      vpsInstanceId: vpsInstanceId,
      instanceName: instanceData.instance_name,
      connectionStatus: instanceData.connection_status,
      userId: user.id,
      userEmail: user.email
    });

    // ✅ CHAMADA PARA VPS COM TRATAMENTO DE ERRO ROBUSTO
    const vpsPayload = {
      instanceId: vpsInstanceId,
      phone: phone.replace(/\D/g, ''), // Limpar caracteres não numéricos
      message: message.trim()
    };

    console.log('[Messaging Service] 📡 Enviando para VPS:', {
      url: `${VPS_CONFIG.baseUrl}/send`,
      payload: {
        ...vpsPayload,
        phone: vpsPayload.phone.substring(0, 4) + '****'
      }
    });

    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify(vpsPayload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    // ✅ TRATAMENTO DE RESPOSTA DA VPS
    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('[Messaging Service] ❌ Erro HTTP da VPS:', {
        status: vpsResponse.status,
        statusText: vpsResponse.statusText,
        errorText: errorText.substring(0, 300),
        vpsUrl: `${VPS_CONFIG.baseUrl}/send`
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: `Erro na VPS (${vpsResponse.status}): ${errorText.substring(0, 100)}`
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let vpsData;
    try {
      vpsData = await vpsResponse.json();
    } catch (parseError) {
      console.error('[Messaging Service] ❌ Erro ao fazer parse da resposta da VPS:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Resposta inválida da VPS'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!vpsData?.success) {
      console.error('[Messaging Service] ❌ VPS retornou erro:', vpsData);
      return new Response(JSON.stringify({
        success: false,
        error: vpsData?.error || 'Erro desconhecido na VPS'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Messaging Service] ✅ Mensagem enviada com sucesso:', {
      success: vpsData.success,
      messageId: vpsData.messageId || 'N/A',
      timestamp: vpsData.timestamp,
      user: user.email,
      vpsInstanceId,
      phone: phone.substring(0, 4) + '****'
    });
    
    // ✅ RESPOSTA DE SUCESSO PADRONIZADA
    return new Response(JSON.stringify({
      success: true,
      data: {
        messageId: vpsData.messageId,
        timestamp: vpsData.timestamp || new Date().toISOString(),
        phone: vpsData.phone || phone,
        instanceId: vpsData.instanceId || vpsInstanceId
      },
      method: 'EDGE_FUNCTION_VPS_MESSAGING',
      vpsInstanceId: vpsInstanceId,
      user: user.email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Messaging Service] ❌ Erro crítico:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
