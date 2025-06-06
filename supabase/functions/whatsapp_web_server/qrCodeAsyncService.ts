
import { corsHeaders, VPS_CONFIG } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const asyncId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 Buscando QR Code para: ${instanceData.instanceId}`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // 1. Buscar instância no Supabase
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada ou sem permissão');
    }

    console.log(`[QR Code Async] 📋 Instância encontrada:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name
    });

    // 2. Buscar QR Code atualizado da VPS
    console.log(`[QR Code Async] 🔄 Buscando QR atualizado da VPS...`);
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);
    
    if (!vpsResult.success) {
      if (vpsResult.error?.includes('ainda não foi gerado') || vpsResult.error?.includes('inicializando')) {
        console.log(`[QR Code Async] ⏳ QR Code ainda não disponível`);
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            error: 'QR Code ainda não disponível',
            message: 'Aguarde alguns segundos e tente novamente'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(vpsResult.error || 'Falha ao obter QR Code da VPS');
    }

    if (!vpsResult.qrCode) {
      console.log(`[QR Code Async] ⏳ QR Code ainda não disponível`);
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda não disponível',
          message: 'Aguarde alguns segundos e tente novamente'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[QR Code Async] ✅ QR Code atualizado da VPS`);

    // 3. Atualizar QR Code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: vpsResult.qrCode,
        web_status: 'waiting_scan',
        connection_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error('[QR Code Async] ❌ Erro ao atualizar banco:', updateError);
      throw updateError;
    }

    console.log(`[QR Code Async] ✅ QR Code atualizado no banco com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: vpsResult.qrCode,
        source: 'vps',
        asyncId,
        message: 'QR Code obtido com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ ERRO GERAL [${asyncId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        asyncId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
