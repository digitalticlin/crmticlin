
import { corsHeaders, VPS_CONFIG, isRealQRCode, normalizeQRCode } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 CORREÇÃO - Buscando QR Code para: ${instanceData.instanceId} [${qrId}]`);

  try {
    // 1. Validar dados da requisição
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO - Validando instance ID: ${instanceId}`);

    // 2. Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO - Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] 📋 CORREÇÃO - Instância encontrada [${qrId}]:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name,
      hasExistingQR: !!instance.qr_code,
      webStatus: instance.web_status,
      connectionStatus: instance.connection_status,
      lastUpdate: instance.updated_at
    });

    // 3. Verificar se já possui QR Code válido no banco
    if (instance.qr_code && isRealQRCode(instance.qr_code)) {
      console.log(`[QR Code Async] ✅ CORREÇÃO - QR Code já existe no banco [${qrId}]`);
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          source: 'database',
          qrId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Buscar QR Code da VPS (porta 3001)
    if (!instance.vps_instance_id) {
      throw new Error('Instância não possui VPS Instance ID');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO - Comunicando com VPS [${qrId}]:`, {
      vpsInstanceId: instance.vps_instance_id,
      serverUrl: VPS_CONFIG.baseUrl
    });

    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);

    console.log(`[QR Code Async] 📡 CORREÇÃO - Resposta da VPS [${qrId}]:`, {
      success: vpsResult.success,
      hasQrCode: !!vpsResult.qrCode,
      qrCodeLength: vpsResult.qrCode ? vpsResult.qrCode.length : 0,
      error: vpsResult.error
    });

    if (vpsResult.success && vpsResult.qrCode) {
      // 5. Salvar QR Code no banco e atualizar status
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: vpsResult.qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error(`[QR Code Async] ⚠️ CORREÇÃO - Erro ao salvar QR Code [${qrId}]:`, updateError);
      } else {
        console.log(`[QR Code Async] ✅ CORREÇÃO - QR Code salvo no banco [${qrId}]`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: vpsResult.qrCode,
          source: 'vps',
          qrId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // QR Code ainda sendo gerado
      console.log(`[QR Code Async] ⏳ CORREÇÃO - QR Code ainda sendo gerado [${qrId}]`);
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: vpsResult.error || 'QR Code ainda não foi gerado ou instância ainda inicializando',
          qrId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ CORREÇÃO - Erro geral [${qrId}]:`, error);
    
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
