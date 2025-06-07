
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

/**
 * Serviço V3 para QR Code - seguindo processo correto especificado
 */

export async function getQRCodeV3Async(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_v3_${Date.now()}`;
  console.log(`[QR Code V3] 📱 Buscando QR Code - PROCESSO CORRETO [${qrId}]:`, instanceData);
  
  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code V3] 🔍 Validando instance ID: ${instanceId}`);

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code V3] ❌ Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    const { vps_instance_id: vpsInstanceId, instance_name: instanceName } = instance;
    
    if (!vpsInstanceId) {
      throw new Error('VPS Instance ID não encontrado na instância');
    }

    console.log(`[QR Code V3] 📋 Instância encontrada [${qrId}]:`, {
      id: instance.id,
      vpsInstanceId,
      instanceName,
      hasExistingQR: !!instance.qr_code,
      webStatus: instance.web_status,
      connectionStatus: instance.connection_status
    });

    // CORREÇÃO: PRIMEIRO verificar se já existe QR Code válido no banco (prioridade)
    if (instance.qr_code && instance.updated_at) {
      const qrAge = Date.now() - new Date(instance.updated_at).getTime();
      const maxAge = 5 * 60 * 1000; // CORREÇÃO: 5 minutos para QR Code válido
      
      if (qrAge < maxAge && instance.qr_code.startsWith('data:image/')) {
        console.log(`[QR Code V3] ✅ QR Code válido encontrado no banco (${Math.round(qrAge/1000)}s de idade)`);
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: instance.qr_code,
            source: 'database',
            instanceId,
            instanceName,
            age: Math.round(qrAge/1000),
            webStatus: instance.web_status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Se não existe QR válido no banco, buscar da VPS
    console.log(`[QR Code V3] 🌐 Buscando QR Code da VPS [${qrId}]:`, {
      vpsInstanceId,
      serverUrl: "http://31.97.24.222:3001"
    });

    const vpsResponse = await makeVPSRequest(`/instance/${vpsInstanceId}/qr`, 'GET');

    console.log(`[QR Code V3] 📡 Resposta da VPS [${qrId}]:`, {
      success: vpsResponse.success,
      hasQrCode: !!(vpsResponse.data?.qrCode),
      qrCodeLength: vpsResponse.data?.qrCode?.length || 0,
      status: vpsResponse.data?.status,
      error: vpsResponse.data?.error || vpsResponse.error
    });

    if (vpsResponse.success && vpsResponse.data?.qrCode) {
      // CORREÇÃO: Normalizar QR Code para data URL format
      let normalizedQrCode = vpsResponse.data.qrCode;
      if (!normalizedQrCode.startsWith('data:image/')) {
        normalizedQrCode = `data:image/png;base64,${normalizedQrCode}`;
      }

      // CORREÇÃO: Salvar no banco com status correto
      console.log(`[QR Code V3] 💾 Salvando QR Code normalizado no banco...`);
      
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: normalizedQrCode,
          web_status: 'waiting_scan',
          connection_status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error(`[QR Code V3] ⚠️ Erro ao salvar QR no banco:`, updateError);
        // Não falhar aqui, retornar o QR mesmo assim
      } else {
        console.log(`[QR Code V3] ✅ QR Code salvo no banco com sucesso (normalizado)`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: normalizedQrCode,
          source: 'vps',
          instanceId,
          instanceName,
          webStatus: 'waiting_scan',
          normalized: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // QR Code ainda não está disponível
      console.log(`[QR Code V3] ⏳ QR Code ainda sendo gerado [${qrId}]`);
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda sendo gerado',
          instanceId,
          instanceName,
          status: vpsResponse.data?.status || 'unknown'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error(`[QR Code V3] ❌ Erro [${qrId}]:`, error);
    
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
