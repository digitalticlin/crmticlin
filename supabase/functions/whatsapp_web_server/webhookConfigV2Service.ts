
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

/**
 * Serviço V2 para configuração de webhook - melhorado
 * Garante que o webhook seja configurado corretamente para cada instância
 */

export async function configureWebhookV2ForInstance(supabase: any, instanceId: string, vpsInstanceId: string) {
  const configId = `webhook_v2_${Date.now()}`;
  console.log(`[Webhook V2] 🔧 Configurando webhook melhorado [${configId}] para: ${instanceId}`);
  
  try {
    // URL do webhook que irá receber os eventos
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook_whatsapp_web`;
    
    console.log(`[Webhook V2] 📡 URL webhook: ${webhookUrl}`);
    console.log(`[Webhook V2] 🆔 VPS Instance ID: ${vpsInstanceId}`);

    // Configurar webhook na VPS usando o endpoint correto
    const webhookPayload = {
      webhookUrl: webhookUrl,
      events: ['messages.upsert', 'qr.update', 'connection.update'],
      instanceId: vpsInstanceId,
      configId: configId
    };

    console.log(`[Webhook V2] 📋 Payload:`, webhookPayload);

    // Fazer requisição para a VPS
    const vpsResponse = await makeVPSRequest(`/instance/${vpsInstanceId}/webhook`, 'POST', webhookPayload);

    if (!vpsResponse.success) {
      throw new Error(`Falha na configuração VPS: ${vpsResponse.error}`);
    }

    console.log(`[Webhook V2] ✅ Webhook configurado na VPS:`, vpsResponse.data);

    // Salvar configuração no banco para tracking
    const { error: saveError } = await supabase
      .from('sync_logs')
      .insert({
        function_name: 'configure_webhook_v2',
        status: 'success',
        result: {
          configId,
          instanceId,
          vpsInstanceId,
          webhookUrl,
          vpsResponse: vpsResponse.data
        }
      });

    if (saveError) {
      console.error(`[Webhook V2] ⚠️ Erro ao salvar log:`, saveError);
    }

    return {
      success: true,
      configId,
      webhookUrl,
      vpsResponse: vpsResponse.data,
      message: 'Webhook V2 configurado com sucesso'
    };

  } catch (error) {
    console.error(`[Webhook V2] ❌ Erro na configuração [${configId}]:`, error);
    
    // Log do erro
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'configure_webhook_v2',
        status: 'error',
        error_message: error.message,
        result: { configId, instanceId, vpsInstanceId }
      });

    return {
      success: false,
      error: error.message,
      configId
    };
  }
}

/**
 * Configuração automática de webhook durante criação de instância
 */
export async function autoConfigureWebhookV2(supabase: any, instanceData: any) {
  const autoId = `auto_webhook_${Date.now()}`;
  console.log(`[Auto Webhook V2] 🚀 Configuração automática [${autoId}]:`, instanceData);

  try {
    const { instanceId, vpsInstanceId } = instanceData;
    
    if (!vpsInstanceId) {
      console.warn(`[Auto Webhook V2] ⚠️ VPS Instance ID não fornecido`);
      return { success: false, error: 'VPS Instance ID obrigatório' };
    }

    // Aguardar um momento para a instância estar pronta
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Configurar webhook
    const result = await configureWebhookV2ForInstance(supabase, instanceId, vpsInstanceId);

    console.log(`[Auto Webhook V2] ${result.success ? '✅' : '❌'} Resultado:`, result);

    return result;

  } catch (error) {
    console.error(`[Auto Webhook V2] ❌ Erro na configuração automática [${autoId}]:`, error);
    return { success: false, error: error.message, autoId };
  }
}

/**
 * Verificar e corrigir webhook se necessário
 */
export async function verifyAndFixWebhookV2(supabase: any, instanceId: string, vpsInstanceId: string) {
  const verifyId = `verify_${Date.now()}`;
  console.log(`[Verify Webhook V2] 🔍 Verificando webhook [${verifyId}] para: ${instanceId}`);

  try {
    // Primeiro tentar verificar o status do webhook na VPS
    const statusResponse = await makeVPSRequest(`/instance/${vpsInstanceId}/webhook/status`, 'GET');

    if (statusResponse.success && statusResponse.data?.configured) {
      console.log(`[Verify Webhook V2] ✅ Webhook já configurado`);
      return { success: true, alreadyConfigured: true };
    }

    // Se não estiver configurado, configurar agora
    console.log(`[Verify Webhook V2] 🔧 Webhook não configurado, configurando...`);
    
    const configResult = await configureWebhookV2ForInstance(supabase, instanceId, vpsInstanceId);
    
    return {
      success: configResult.success,
      wasFixed: true,
      configResult
    };

  } catch (error) {
    console.error(`[Verify Webhook V2] ❌ Erro na verificação [${verifyId}]:`, error);
    
    // Tentar configurar mesmo com erro na verificação
    try {
      const configResult = await configureWebhookV2ForInstance(supabase, instanceId, vpsInstanceId);
      return {
        success: configResult.success,
        wasFixed: true,
        configResult,
        verifyError: error.message
      };
    } catch (configError) {
      return {
        success: false,
        error: `Verificação e configuração falharam: ${error.message}, ${configError.message}`
      };
    }
  }
}
