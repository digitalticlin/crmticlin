
import { corsHeaders } from './config.ts';

export async function saveQRCodeToDatabase(supabase: any, qrData: any, userId: string) {
  const saveId = `save_qr_${Date.now()}`;
  console.log(`[Save QR Code] 💾 SALVANDO QR CODE no banco [${saveId}]:`, {
    vpsInstanceId: qrData.vpsInstanceId,
    hasQrCode: !!qrData.qrCode,
    qrCodeLength: qrData.qrCode?.length || 0
  });

  try {
    const { vpsInstanceId, qrCode } = qrData;
    
    if (!vpsInstanceId || !qrCode) {
      throw new Error('VPS Instance ID e QR Code são obrigatórios');
    }

    console.log(`[Save QR Code] 🔍 Buscando instância por vps_instance_id: ${vpsInstanceId}`);

    // Buscar instância por vps_instance_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', vpsInstanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[Save QR Code] ❌ Instância não encontrada [${saveId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[Save QR Code] ✅ Instância encontrada [${saveId}]:`, {
      id: instance.id,
      instanceName: instance.instance_name,
      currentQrCode: !!instance.qr_code
    });

    // Atualizar QR Code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: qrCode,
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      console.error(`[Save QR Code] ❌ Erro ao atualizar QR Code [${saveId}]:`, updateError);
      throw new Error(`Erro ao salvar QR Code: ${updateError.message}`);
    }

    console.log(`[Save QR Code] 🎉 QR Code salvo com sucesso [${saveId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        instanceId: instance.id,
        instanceName: instance.instance_name,
        vpsInstanceId: vpsInstanceId,
        message: 'QR Code salvo no banco com sucesso',
        saveId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[Save QR Code] ❌ ERRO [${saveId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        saveId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
