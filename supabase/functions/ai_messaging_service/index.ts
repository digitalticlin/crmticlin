
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO DA VPS (mesma da whatsapp_messaging_service)
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
    console.log('[AI Messaging Service] 🚀 Iniciando processamento - N8N AI Agent');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const aiAgentApiKey = Deno.env.get('AI_AGENT_API_KEY');

    // ✅ VALIDAÇÃO DE API KEY
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[AI Messaging Service] ❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'JSON inválido no body da requisição'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { apiKey, instanceId, leadId, createdByUserId, phone, message, mediaType, mediaUrl, agentId } = requestBody;

    // ✅ AUTENTICAÇÃO VIA API KEY
    if (!apiKey || !aiAgentApiKey || apiKey !== aiAgentApiKey) {
      console.error('[AI Messaging Service] ❌ API Key inválida ou ausente');
      return new Response(JSON.stringify({
        success: false,
        error: 'API Key inválida ou ausente'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ VALIDAÇÃO DOS PARÂMETROS OBRIGATÓRIOS
    if (!instanceId || !leadId || !createdByUserId || !phone || !message) {
      console.error('[AI Messaging Service] ❌ Parâmetros obrigatórios ausentes:', {
        instanceId: !!instanceId,
        leadId: !!leadId,
        createdByUserId: !!createdByUserId,
        phone: !!phone,
        message: !!message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceId, leadId, createdByUserId, phone e message são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[AI Messaging Service] 📤 Processando mensagem do AI Agent:', {
      instanceId,
      leadId,
      createdByUserId,
      phone: phone.substring(0, 4) + '****',
      messageLength: message.length,
      mediaType: mediaType || 'text',
      hasMediaUrl: !!mediaUrl,
      agentId: agentId || 'N/A'
    });

    // ✅ CLIENTE SUPABASE COM SERVICE ROLE (BYPASS RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se instância pertence ao usuário
    const { data: instanceData, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, vps_instance_id, instance_name, connection_status, created_by_user_id')
      .eq('id', instanceId)
      .eq('created_by_user_id', createdByUserId)
      .single();

    if (instanceError || !instanceData) {
      console.error('[AI Messaging Service] ❌ Instância não encontrada ou não pertence ao usuário:', {
        instanceId,
        createdByUserId,
        error: instanceError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Instância não encontrada ou não autorizada'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ VERIFICAR SE INSTÂNCIA ESTÁ CONECTADA
    if (instanceData.connection_status !== 'connected') {
      console.error('[AI Messaging Service] ❌ Instância não está conectada:', {
        instanceId,
        status: instanceData.connection_status
      });
      return new Response(JSON.stringify({
        success: false,
        error: `Instância não está conectada (status: ${instanceData.connection_status})`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se lead pertence ao usuário
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('id, phone, name, created_by_user_id')
      .eq('id', leadId)
      .eq('created_by_user_id', createdByUserId)
      .single();

    if (leadError || !leadData) {
      console.error('[AI Messaging Service] ❌ Lead não encontrado ou não pertence ao usuário:', {
        leadId,
        createdByUserId,
        error: leadError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead não encontrado ou não autorizado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vpsInstanceId = instanceData.vps_instance_id;
    if (!vpsInstanceId) {
      console.error('[AI Messaging Service] ❌ VPS Instance ID não encontrado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuração da instância incompleta'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[AI Messaging Service] 🤖 Enviando mensagem do AI Agent:', {
      instanceName: instanceData.instance_name,
      vpsInstanceId,
      leadName: leadData.name,
      phoneMatch: phone.replace(/\D/g, '') === leadData.phone.replace(/\D/g, ''),
      agentId: agentId || 'N/A'
    });

    // ✅ PREPARAR PAYLOAD PARA VPS
    const vpsPayload = {
      instanceId: vpsInstanceId,
      phone: phone.replace(/\D/g, ''), // Limpar caracteres não numéricos
      message: message.trim(),
      mediaType: mediaType || 'text',
      mediaUrl: mediaUrl || null
    };

    console.log('[AI Messaging Service] 📡 Enviando para VPS:', {
      url: `${VPS_CONFIG.baseUrl}/send`,
      payload: {
        ...vpsPayload,
        phone: vpsPayload.phone.substring(0, 4) + '****',
        mediaUrl: vpsPayload.mediaUrl ? vpsPayload.mediaUrl.substring(0, 50) + '...' : null
      }
    });

    // ✅ ENVIAR PARA VPS (CÓDIGO IDÊNTICO À whatsapp_messaging_service)
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'User-Agent': 'Supabase-AI-Agent/1.0'
      },
      body: JSON.stringify(vpsPayload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    // ✅ TRATAMENTO DE RESPOSTA DA VPS
    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('[AI Messaging Service] ❌ Erro HTTP da VPS:', {
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
      console.error('[AI Messaging Service] ❌ Erro ao fazer parse da resposta da VPS:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Resposta inválida da VPS'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!vpsData?.success) {
      console.error('[AI Messaging Service] ❌ VPS retornou erro:', vpsData);
      return new Response(JSON.stringify({
        success: false,
        error: vpsData?.error || 'Erro desconhecido na VPS'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[AI Messaging Service] ✅ Mensagem enviada com sucesso pela VPS:', {
      success: vpsData.success,
      messageId: vpsData.messageId || 'N/A',
      timestamp: vpsData.timestamp,
      agentId: agentId || 'N/A',
      vpsInstanceId,
      phone: phone.substring(0, 4) + '****'
    });

    // ✅ SALVAR MENSAGEM NO BANCO USANDO RPC ISOLADA
    console.log('[AI Messaging Service] 💾 Salvando mensagem do AI Agent no banco...');
    
    try {
      const { data: saveResult, error: saveError } = await supabase.rpc(
        'save_sent_message_only',
        {
          p_vps_instance_id: vpsInstanceId,
          p_phone: phone.replace(/\D/g, ''),
          p_message_text: message.trim(),
          p_external_message_id: vpsData.messageId || null,
          p_contact_name: leadData.name || null,
          p_media_type: mediaType || 'text',
          p_media_url: mediaUrl || null
        }
      );

      if (saveError) {
        console.error('[AI Messaging Service] ❌ Erro ao salvar mensagem no banco:', saveError);
      } else if (saveResult?.success) {
        console.log('[AI Messaging Service] ✅ Mensagem do AI Agent salva no banco:', {
          messageId: saveResult.data?.message_id,
          leadId: saveResult.data?.lead_id,
          agentId: agentId || 'N/A',
          source: 'ai_agent'
        });
      }
    } catch (saveError) {
      console.error('[AI Messaging Service] ❌ Erro ao executar RPC de salvamento:', saveError);
    }

    // ✅ RESPOSTA DE SUCESSO PARA O N8N
    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem do AI Agent enviada com sucesso',
      data: {
        messageId: vpsData.messageId,
        instanceId: instanceData.id,
        vpsInstanceId,
        leadId: leadData.id,
        phone: phone.replace(/\D/g, ''),
        mediaType: mediaType || 'text',
        timestamp: vpsData.timestamp || new Date().toISOString(),
        agentId: agentId || null,
        source: 'ai_agent',
        user: {
          id: createdByUserId
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI Messaging Service] ❌ Erro interno do servidor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
