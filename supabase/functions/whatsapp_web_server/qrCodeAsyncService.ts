
import { corsHeaders, VPS_CONFIG, isRealQRCode } from './config.ts';
import { createVPSRequest } from './vpsRequestService.ts';
import { updateQRCodeInDatabase } from './qrCodeDatabaseService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const requestId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 CORREÇÃO COMPLETA - Buscando QR Code para: ${instanceData.instanceId} [${requestId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO COMPLETA - Validando instance ID: ${instanceId}`);

    // CORREÇÃO: Buscar instância tanto por UUID quanto por created_by_user_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .or(`id.eq.${instanceId},vps_instance_id.eq.${instanceId}`)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO COMPLETA - Instância não encontrada [${requestId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] 📋 CORREÇÃO COMPLETA - Instância encontrada [${requestId}]:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name,
      hasExistingQR: !!instance.qr_code && isRealQRCode(instance.qr_code),
      webStatus: instance.web_status,
      connectionStatus: instance.connection_status,
      lastUpdate: instance.updated_at
    });

    // CORREÇÃO: Verificar se já temos QR Code válido no cache
    if (instance.qr_code && isRealQRCode(instance.qr_code)) {
      console.log(`[QR Code Async] ✅ CORREÇÃO COMPLETA - QR Code do cache [${requestId}]`);
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          cached: true,
          instanceName: instance.instance_name,
          message: 'QR Code obtido do cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CORREÇÃO: Comunicar com VPS para obter QR Code
    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO COMPLETA - Comunicando com VPS [${requestId}]:`, {
      vpsInstanceId: instance.vps_instance_id,
      serverUrl: VPS_CONFIG.baseUrl
    });

    const vpsResult = await createVPSRequest(`/instance/${instance.vps_instance_id}/qr`, 'GET');

    console.log(`[QR Code Async] 📡 CORREÇÃO COMPLETA - Resposta da VPS [${requestId}]:`, {
      success: vpsResult.success,
      hasQrCode: !!(vpsResult.data?.qrCode || vpsResult.data?.qr),
      qrCodeLength: (vpsResult.data?.qrCode || vpsResult.data?.qr || '').length,
      error: vpsResult.error
    });

    if (vpsResult.success && vpsResult.data) {
      const qrCode = vpsResult.data.qrCode || vpsResult.data.qr;
      
      if (qrCode && isRealQRCode(qrCode)) {
        console.log(`[QR Code Async] 🎉 CORREÇÃO COMPLETA - QR Code REAL obtido da VPS [${requestId}]`);
        
        // CORREÇÃO: Atualizar no banco de dados
        const updated = await updateQRCodeInDatabase(supabase, instance.id, qrCode);
        
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: qrCode,
            instanceName: instance.instance_name,
            vpsInstanceId: instance.vps_instance_id,
            updated: updated,
            message: 'QR Code obtido da VPS e atualizado no banco'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log(`[QR Code Async] ⏳ CORREÇÃO COMPLETA - QR Code ainda sendo gerado [${requestId}]`);
        
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            instanceName: instance.instance_name,
            vpsInstanceId: instance.vps_instance_id,
            error: 'QR Code ainda sendo gerado'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`[QR Code Async] ⚠️ CORREÇÃO COMPLETA - VPS não retornou QR Code [${requestId}]:`, vpsResult.error);
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: vpsResult.error || 'VPS não disponível',
          instanceName: instance.instance_name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ CORREÇÃO COMPLETA - Erro geral [${requestId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        requestId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
