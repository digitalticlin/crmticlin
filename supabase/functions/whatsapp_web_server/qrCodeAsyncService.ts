
import { corsHeaders, VPS_CONFIG, getVPSHeaders, normalizeQRCode } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const getQRId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 🔳 CORREÇÃO CRÍTICA - Obtendo QR Code [${getQRId}]:`, instanceData.instanceId);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('ID da instância é obrigatório para obter QR Code');
    }

    console.log(`[QR Code Async] 📋 CORREÇÃO CRÍTICA - Validações passaram para: ${instanceId}`);

    // Buscar instância no banco para obter vps_instance_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, connection_status, qr_code')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO CRÍTICA - Instância não encontrada:`, instanceError);
      throw new Error('Instância não encontrada no banco de dados');
    }

    const vpsInstanceId = instance.vps_instance_id;
    if (!vpsInstanceId) {
      throw new Error('VPS Instance ID não encontrado para esta instância');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO CRÍTICA - Buscando QR na VPS, vpsInstanceId: ${vpsInstanceId}`);
    
    // Tentar obter QR Code da VPS
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/${vpsInstanceId}/qr`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error(`[QR Code Async] ❌ CORREÇÃO CRÍTICA - Erro VPS:`, errorText);
      
      if (vpsResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            waiting: true,
            message: 'Instância ainda não disponível na VPS',
            getQRId 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Falha na VPS: ${vpsResponse.status} - ${errorText}`);
    }

    const vpsData = await vpsResponse.json();
    console.log(`[QR Code Async] ✅ CORREÇÃO CRÍTICA - VPS Response:`, vpsData);

    // CORREÇÃO CRÍTICA: Usar normalizeQRCode corretamente
    const qrCode = normalizeQRCode(vpsData);
    
    if (!qrCode) {
      console.log(`[QR Code Async] ⏳ CORREÇÃO CRÍTICA - QR Code ainda não disponível`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          waiting: true,
          message: 'QR Code ainda está sendo gerado',
          getQRId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar QR Code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: qrCode,
        connection_status: 'waiting_qr',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error(`[QR Code Async] ❌ CORREÇÃO CRÍTICA - Erro ao atualizar QR no banco:`, updateError);
    }

    console.log(`[QR Code Async] ✅ CORREÇÃO CRÍTICA - QR Code obtido e salvo [${getQRId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: qrCode,
        getQRId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ CORREÇÃO CRÍTICA - Erro crítico [${getQRId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        getQRId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
