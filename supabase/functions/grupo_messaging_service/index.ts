import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ CONFIGURAÇÃO VPS (via env)
const VPS_CONFIG = {
  baseUrl: Deno.env.get('VPS_BASE_URL')!,
  authToken: Deno.env.get('VPS_API_TOKEN') ?? '',
  timeout: Number(Deno.env.get('VPS_TIMEOUT_MS') ?? '30000')
};

serve(async (req) => {
  // Suporte a CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Group Messaging Service] 🚀 Iniciando envio para grupo WhatsApp');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ PARSE DO PAYLOAD N8N
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('[Group Messaging Service] ❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'JSON inválido no body da requisição'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, instanceNumber, instanceName, groupId, message, fileUrl } = requestBody;

    // ✅ VALIDAÇÃO DOS CAMPOS OBRIGATÓRIOS
    if (action !== 'send_group_message') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action deve ser "send_group_message"'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!instanceName || !groupId || !message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'instanceName, groupId e message são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Group Messaging Service] 📤 Dados recebidos:', {
      instanceNumber: instanceNumber?.substring(0, 6) + '****',
      instanceName,
      groupId: groupId?.substring(0, 10) + '****',
      messageLength: message?.length,
      hasFile: !!fileUrl,
      fileUrl: fileUrl ? fileUrl.substring(0, 50) + '...' : null
    });

    // ✅ VALIDAR SE INSTÂNCIA EXISTS (busca por vps_instance_id)
    const { data: instanceData, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, vps_instance_id, instance_name')
      .eq('vps_instance_id', instanceName)
      .single();

    if (instanceError || !instanceData) {
      console.error('[Group Messaging Service] ❌ Instância não encontrada:', {
        instanceName,
        error: instanceError?.message
      });
      return new Response(JSON.stringify({
        success: false,
        error: `Instância WhatsApp '${instanceName}' não encontrada`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ✅ PREPARAR PAYLOAD PARA VPS (DETECTAR TIPO AUTOMATICAMENTE)
    const hasFile = !!fileUrl;
    const vpsPayload = {
      instanceId: instanceName,                    // Nome da instância VPS
      phone: groupId,                             // ID do grupo no campo phone
      message: message.trim(),
      mediaType: hasFile ? 'document' : 'text',   // Auto-detectar baseado na presença do arquivo
      mediaUrl: fileUrl || null
    };

    console.log('[Group Messaging Service] 📡 Enviando para VPS:', {
      url: `${VPS_CONFIG.baseUrl}/send`,
      instanceId: instanceName,
      groupId: groupId?.substring(0, 15) + '****',
      messageLength: message.length,
      mediaType: vpsPayload.mediaType,
      hasFile: !!vpsPayload.mediaUrl
    });

    // ✅ ENVIAR PARA VPS API
    const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
        'x-api-token': VPS_CONFIG.authToken,
        'User-Agent': 'Supabase-Edge-Function-Groups/1.0'
      },
      body: JSON.stringify(vpsPayload),
      signal: AbortSignal.timeout(VPS_CONFIG.timeout)
    });

    // ✅ TRATAR RESPOSTA DA VPS
    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error('[Group Messaging Service] ❌ Erro HTTP da VPS:', {
        status: vpsResponse.status,
        statusText: vpsResponse.statusText,
        errorText: errorText.substring(0, 300),
        vpsUrl: `${VPS_CONFIG.baseUrl}/send`
      });

      return new Response(JSON.stringify({
        success: false,
        error: `Erro na VPS: ${vpsResponse.status} - ${vpsResponse.statusText}`,
        details: errorText.substring(0, 200)
      }), {
        status: vpsResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vpsResult = await vpsResponse.json();
    console.log('[Group Messaging Service] ✅ Sucesso VPS:', {
      vpsStatus: vpsResult?.success ? 'OK' : 'ERROR',
      vpsMessage: vpsResult?.message?.substring(0, 100)
    });

    // ✅ LOG DE SUCESSO PARA AUDITORIA
    await supabase.from('sync_logs').insert({
      function_name: 'grupo_messaging_service',
      status: 'success',
      result: {
        instanceName,
        groupId: groupId?.substring(0, 15) + '****',
        messageLength: message.length,
        messageType: vpsPayload.mediaType,
        hasFile: !!fileUrl,
        vpsResponse: vpsResult?.success ? 'sent' : 'failed',
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem enviada para o grupo com sucesso',
      data: {
        instanceName,
        groupId: groupId?.substring(0, 15) + '****',
        messageLength: message.length,
        messageType: vpsPayload.mediaType,
        hasFile: !!fileUrl,
        vpsResult: vpsResult?.success ? 'sent' : 'failed'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Group Messaging Service] ❌ Erro geral:', error);
    
    // ✅ LOG DE ERRO PARA AUDITORIA
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('sync_logs').insert({
      function_name: 'grupo_messaging_service',
      status: 'error',
      error_message: error.message,
      result: {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/* 
📱 EDGE FUNCTION: Grupo Messaging Service

FUNCIONALIDADE:
✅ Envio DIRETO de mensagens para grupos WhatsApp
✅ Suporte a texto e documentos
✅ Validação de instância
✅ Logs de auditoria
❌ NÃO salva mensagens no banco
❌ NÃO usa sistema de filas

PAYLOAD ÚNICO N8N (TEXTO + ARQUIVO):
{
  "action": "send_group_message",
  "instanceNumber": "556299999999", 
  "instanceName": "digitalticlin",
  "groupId": "120363025814587945@g.us",
  "message": "Mensagem para o grupo",
  "fileUrl": "https://example.com/doc.pdf"
}

FORMATOS ACEITOS:
- fileUrl: URL direta do arquivo (PDF, DOC, XLS, IMG, etc.)
- Sem fileUrl: Envia apenas texto
- Com fileUrl: Detecta automaticamente como documento

🔧 DEPLOY:
supabase functions deploy grupo_messaging_service
*/