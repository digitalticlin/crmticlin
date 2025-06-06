
import { corsHeaders, normalizeQRCode } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 🚀 CORREÇÃO SUPER SIMPLES - Iniciando processo: ${instanceData.instanceId} [${qrId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO SUPER SIMPLES - Buscando instância: ${instanceId}`);

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO SUPER SIMPLES - Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] ✅ CORREÇÃO SUPER SIMPLES - Instância encontrada:`, {
      name: instance.instance_name,
      vpsId: instance.vps_instance_id,
      hasQR: !!instance.qr_code,
      status: instance.web_status
    });

    // Verificar se já tem QR Code válido no banco
    if (instance.qr_code && instance.qr_code.startsWith('data:image/')) {
      console.log(`[QR Code Async] ✅ CORREÇÃO SUPER SIMPLES - QR Code já disponível no banco`);
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          source: 'database_existing',
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado na instância');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO SUPER SIMPLES - Buscando QR Code na VPS: ${instance.vps_instance_id}`);
    
    // Buscar QR Code na VPS (agora deve vir como data URL)
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);

    if (vpsResult.success && vpsResult.qrCode) {
      console.log(`[QR Code Async] 📥 CORREÇÃO SUPER SIMPLES - QR Code obtido da VPS: ${vpsResult.qrCode.substring(0, 100)}`);
      
      let finalQRCode: string;
      
      // CORREÇÃO SUPER SIMPLES: Se já é data URL, usar direto. Se não, normalizar.
      if (vpsResult.qrCode.startsWith('data:image/')) {
        console.log(`[QR Code Async] ✅ CORREÇÃO SUPER SIMPLES - QR Code já é data URL, usando direto!`);
        finalQRCode = vpsResult.qrCode;
      } else {
        console.log(`[QR Code Async] 🔄 CORREÇÃO SUPER SIMPLES - QR Code é texto, normalizando...`);
        try {
          finalQRCode = await normalizeQRCode(vpsResult.qrCode);
          console.log(`[QR Code Async] ✅ CORREÇÃO SUPER SIMPLES - Normalização concluída`);
        } catch (normalizeError) {
          console.error(`[QR Code Async] ❌ CORREÇÃO SUPER SIMPLES - Falha na normalização:`, normalizeError);
          finalQRCode = vpsResult.qrCode; // Usar original como fallback
        }
      }

      // SALVAMENTO SIMPLES E DIRETO NO BANCO
      console.log(`[QR Code Async] 💾 CORREÇÃO SUPER SIMPLES - Salvando direto no banco...`);
      
      try {
        const { data: updateData, error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({ 
            qr_code: finalQRCode,
            web_status: 'waiting_scan',
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId)
          .select('qr_code, updated_at')
          .single();

        if (updateError) {
          console.error(`[QR Code Async] ❌ CORREÇÃO SUPER SIMPLES - Erro no salvamento:`, updateError);
          throw updateError;
        }

        if (updateData?.qr_code) {
          console.log(`[QR Code Async] ✅ CORREÇÃO SUPER SIMPLES - QR Code salvo com sucesso!`, {
            qrLength: updateData.qr_code.length,
            updatedAt: updateData.updated_at
          });

          return new Response(
            JSON.stringify({
              success: true,
              qrCode: finalQRCode,
              source: 'vps_direct_dataurl',
              savedToDatabase: true,
              qrId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error('QR Code não foi salvo corretamente');
        }

      } catch (saveError: any) {
        console.error(`[QR Code Async] ❌ CORREÇÃO SUPER SIMPLES - Erro crítico no salvamento:`, saveError);
        
        // Ainda retornar QR Code para exibir, mesmo sem salvar
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: finalQRCode,
            source: 'vps_save_failed',
            savedToDatabase: false,
            saveError: saveError?.message || 'Erro desconhecido no salvamento',
            qrId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (vpsResult.waiting) {
      console.log(`[QR Code Async] ⏳ CORREÇÃO SUPER SIMPLES - QR Code ainda sendo gerado`);
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: vpsResult.error || 'QR Code ainda sendo gerado na VPS',
          qrId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(vpsResult.error || 'Falha ao obter QR Code da VPS');
    }

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ CORREÇÃO SUPER SIMPLES - Erro crítico [${qrId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        qrId,
        timestamp: new Date().toISOString(),
        stage: 'critical_error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
