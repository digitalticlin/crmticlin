
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';
import { verifyAndFixWebhookV2 } from './webhookConfigV2Service.ts';

/**
 * Serviço V2 para QR Code - com verificação de webhook
 */

export async function getQRCodeV2Async(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_v2_${Date.now()}`;
  console.log(`[QR Code V2] 📱 Buscando QR Code melhorado [${qrId}]:`, instanceData);
  
  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code V2] 🔍 Validando instance ID: ${instanceId}`);

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code V2] ❌ Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    const { vps_instance_id: vpsInstanceId, instance_name: instanceName } = instance;
    
    if (!vpsInstanceId) {
      throw new Error('VPS Instance ID não encontrado na instância');
    }

    console.log(`[QR Code V2] 📋 Instância encontrada [${qrId}]:`, {
      id: instance.id,
      vpsInstanceId,
      instanceName,
      hasExistingQR: !!instance.qr_code,
      webStatus: instance.web_status,
      connectionStatus: instance.connection_status
    });

    // NOVO: Verificar e corrigir webhook se necessário
    console.log(`[QR Code V2] 🔧 Verificando webhook antes de buscar QR...`);
    const webhookResult = await verifyAndFixWebhookV2(supabase, instanceId, vpsInstanceId);
    
    if (!webhookResult.success) {
      console.warn(`[QR Code V2] ⚠️ Falha na verificação do webhook: ${webhookResult.error}`);
      // Continuar mesmo assim, pois pode funcionar
    } else if (webhookResult.wasFixed) {
      console.log(`[QR Code V2] ✅ Webhook foi configurado/corrigido`);
    }

    // Verificar se já existe QR Code no banco (recente)
    if (instance.qr_code && instance.updated_at) {
      const qrAge = Date.now() - new Date(instance.updated_at).getTime();
      const maxAge = 2 * 60 * 1000; // 2 minutos
      
      if (qrAge < maxAge) {
        console.log(`[QR Code V2] ✅ QR Code encontrado no banco (${Math.round(qrAge/1000)}s de idade)`);
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: instance.qr_code,
            source: 'database',
            instanceId,
            instanceName,
            age: Math.round(qrAge/1000)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar QR Code da VPS
    console.log(`[QR Code V2] 🌐 Comunicando com VPS [${qrId}]:`, {
      vpsInstanceId,
      serverUrl: "http://31.97.24.222:3001"
    });

    const vpsResponse = await makeVPSRequest(`/instance/${vpsInstanceId}/qr`, 'GET');

    console.log(`[QR Code V2] 📡 Resposta da VPS [${qrId}]:`, {
      success: vpsResponse.success,
      hasQrCode: !!(vpsResponse.data?.qrCode),
      qrCodeLength: vpsResponse.data?.qrCode?.length || 0,
      status: vpsResponse.data?.status,
      error: vpsResponse.data?.error || vpsResponse.error
    });

    if (vpsResponse.success && vpsResponse.data?.qrCode) {
      // QR Code encontrado na VPS - salvar no banco também
      console.log(`[QR Code V2] 💾 Salvando QR Code no banco...`);
      
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: vpsResponse.data.qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error(`[QR Code V2] ⚠️ Erro ao salvar QR no banco:`, updateError);
        // Não falhar aqui, retornar o QR mesmo assim
      } else {
        console.log(`[QR Code V2] ✅ QR Code salvo no banco com sucesso`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: vpsResponse.data.qrCode,
          source: 'vps',
          instanceId,
          instanceName,
          status: vpsResponse.data.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // QR Code ainda não está disponível
      console.log(`[QR Code V2] ⏳ QR Code ainda sendo gerado [${qrId}]`);
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda sendo gerado',
          instanceId,
          instanceName,
          status: vpsResponse.data?.status || 'unknown',
          webhookConfigured: webhookResult.success
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error(`[QR Code V2] ❌ Erro [${qrId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        qrId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Forçar regeneração de QR Code
 */
export async function regenerateQRCodeV2(supabase: any, instanceData: any, userId: string) {
  const regenId = `regen_${Date.now()}`;
  console.log(`[QR Code V2] 🔄 Regenerando QR Code [${regenId}]:`, instanceData);

  try {
    const { instanceId } = instanceData;
    
    // Buscar instância
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, instance_name')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Limpar QR Code atual do banco
    await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: null,
        web_status: 'initializing',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    // Reiniciar instância na VPS para gerar novo QR
    const restartResponse = await makeVPSRequest(`/instance/restart`, 'POST', {
      instanceId: instance.vps_instance_id
    });

    if (!restartResponse.success) {
      console.warn(`[QR Code V2] ⚠️ Falha no restart da VPS: ${restartResponse.error}`);
    }

    // Configurar webhook novamente
    const webhookResult = await verifyAndFixWebhookV2(supabase, instanceId, instance.vps_instance_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'QR Code sendo regenerado',
        instanceId,
        regenId,
        webhookConfigured: webhookResult.success
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[QR Code V2] ❌ Erro na regeneração [${regenId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        regenId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
