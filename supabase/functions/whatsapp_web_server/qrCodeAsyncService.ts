
// This file handles the asynchronous QR code generation process

import { corsHeaders, isRealQRCode, normalizeQRCode } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 FASE 1.3 - Buscando QR Code para: ${instanceData.instanceId} [${qrId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 FASE 1.3 - Validando instance ID: ${instanceId}`);

    // 1. Buscar instância no Supabase
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ FASE 1.3 - Instance not found or error:`, instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    const existingQR = instance.qr_code;
    const lastUpdate = instance.updated_at;

    console.log(`[QR Code Async] 📋 FASE 1.3 - Instância encontrada [${qrId}]:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name,
      hasExistingQR: !!existingQR,
      webStatus: instance.web_status,
      connectionStatus: instance.connection_status,
      lastUpdate
    });

    // 2. Se não tiver QR Code no banco, buscar da VPS
    if (!existingQR || !isRealQRCode(existingQR)) {
      console.log(`[QR Code Async] 🔄 FASE 1.3 - QR Code não encontrado no banco, buscando da VPS... [${qrId}]`);

      if (!instance.vps_instance_id) {
        throw new Error('Instância não possui vps_instance_id');
      }

      console.log(`[QR Code Async] 🌐 FASE 1.3 - Comunicando com VPS [${qrId}]:`, {
        vpsInstanceId: instance.vps_instance_id,
        serverUrl: instance.server_url
      });

      // 2.1 Buscando QR Code da VPS
      const vpsResponse = await getVPSInstanceQR(instance.vps_instance_id);

      console.log(`[QR Code Async] 📡 FASE 1.3 - Resposta da VPS [${qrId}]:`, {
        success: vpsResponse.success,
        hasQrCode: !!vpsResponse.qrCode,
        qrCodeLength: vpsResponse.qrCode ? vpsResponse.qrCode.length : 0,
        error: vpsResponse.error
      });

      if (!vpsResponse.success) {
        console.log(`[QR Code Async] ⏳ FASE 1.3 - QR Code ainda sendo gerado [${qrId}]`);
        
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            error: vpsResponse.error || 'QR Code ainda sendo gerado',
            qrId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Se tem QR Code, atualizar no banco
      if (vpsResponse.qrCode) {
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            qr_code: vpsResponse.qrCode,
            updated_at: new Date().toISOString(),
            web_status: 'waiting_scan'
          })
          .eq('id', instanceId);

        if (updateError) {
          console.error(`[QR Code Async] ❌ FASE 1.3 - Error updating QR in database:`, updateError);
        } else {
          console.log(`[QR Code Async] ✅ FASE 1.3 - QR Code salvo no banco [${qrId}]`);
        }

        return new Response(
          JSON.stringify({
            success: true,
            qrCode: vpsResponse.qrCode,
            qrId,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // 3. Se já tem QR Code válido no banco, retorná-lo
      console.log(`[QR Code Async] ✅ FASE 1.3 - Usando QR Code existente do banco [${qrId}]`);
      
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: existingQR,
          qrId,
          fromCache: true,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: Não foi possível obter QR Code
    console.log(`[QR Code Async] ⏳ FASE 1.3 - QR Code ainda não está pronto [${qrId}]`);
    
    return new Response(
      JSON.stringify({
        success: false,
        waiting: true,
        error: 'QR Code ainda sendo gerado, tente novamente em alguns segundos',
        qrId,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[QR Code Async] 💥 FASE 1.3 - ERRO CRÍTICO [${qrId}]:`, {
      error: error.message,
      stack: error.stack
    });
    
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
