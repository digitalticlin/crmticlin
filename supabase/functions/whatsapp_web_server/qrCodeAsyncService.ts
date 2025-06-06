
import { corsHeaders } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 CORREÇÃO FINAL - Buscando QR Code para: ${instanceData.instanceId} [${qrId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO - Validando instance ID: ${instanceId}`);

    // CORREÇÃO: Buscar instância baseada no created_by_user_id (FASE 1)
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId) // CORREÇÃO: Usar created_by_user_id
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO - Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] ✅ CORREÇÃO - Instância encontrada: ${instance.instance_name} (VPS ID: ${instance.vps_instance_id})`);

    // Se já tem QR Code válido no banco, retornar
    if (instance.qr_code && instance.qr_code.length > 50) {
      console.log(`[QR Code Async] ✅ CORREÇÃO - QR Code já disponível no banco`);
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          source: 'database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar QR Code na VPS
    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO - Buscando QR Code na VPS: ${instance.vps_instance_id}`);
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);

    if (vpsResult.success && vpsResult.qrCode) {
      console.log(`[QR Code Async] ✅ CORREÇÃO - QR Code obtido da VPS, atualizando banco...`);
      
      // CORREÇÃO: Atualizar QR Code no banco
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: vpsResult.qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error(`[QR Code Async] ❌ CORREÇÃO - Erro ao atualizar QR no banco:`, updateError);
      } else {
        console.log(`[QR Code Async] ✅ CORREÇÃO - QR Code salvo no banco com sucesso`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: vpsResult.qrCode,
          source: 'vps'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (vpsResult.waiting) {
      console.log(`[QR Code Async] ⏳ CORREÇÃO - QR Code ainda sendo gerado na VPS`);
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: vpsResult.error || 'QR Code ainda sendo gerado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(vpsResult.error || 'Falha ao obter QR Code da VPS');
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
