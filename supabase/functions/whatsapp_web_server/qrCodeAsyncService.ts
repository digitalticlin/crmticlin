
import { corsHeaders, normalizeQRCode } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 🚀 CORREÇÃO ULTRA-ROBUSTA - Iniciando processo: ${instanceData.instanceId} [${qrId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO ULTRA-ROBUSTA - Buscando instância: ${instanceId}`);

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - Instância encontrada:`, {
      name: instance.instance_name,
      vpsId: instance.vps_instance_id,
      hasQR: !!instance.qr_code,
      status: instance.web_status
    });

    // Verificar se já tem QR Code válido no banco
    if (instance.qr_code && instance.qr_code.startsWith('data:image/')) {
      console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - QR Code já disponível no banco`);
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

    console.log(`[QR Code Async] 🌐 CORREÇÃO ULTRA-ROBUSTA - Buscando QR Code na VPS: ${instance.vps_instance_id}`);
    
    // Buscar QR Code na VPS
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);

    if (vpsResult.success && vpsResult.qrCode) {
      console.log(`[QR Code Async] 📥 CORREÇÃO ULTRA-ROBUSTA - QR Code obtido da VPS`);
      
      let finalQRCode: string;
      
      try {
        console.log(`[QR Code Async] 🔄 CORREÇÃO ULTRA-ROBUSTA - Normalizando QR Code...`);
        finalQRCode = await normalizeQRCode(vpsResult.qrCode);
        console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - Normalização concluída`);
      } catch (normalizeError) {
        console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Falha na normalização:`, normalizeError);
        
        // Se a normalização falhar, tentar usar o QR Code original se for válido
        if (vpsResult.qrCode.startsWith('data:image/')) {
          finalQRCode = vpsResult.qrCode;
          console.log(`[QR Code Async] 🔄 CORREÇÃO ULTRA-ROBUSTA - Usando QR Code original da VPS`);
        } else {
          throw new Error(`Falha na normalização do QR Code: ${normalizeError.message}`);
        }
      }

      // SALVAMENTO ULTRA-ROBUSTO NO BANCO
      console.log(`[QR Code Async] 💾 CORREÇÃO ULTRA-ROBUSTA - Iniciando salvamento...`);
      
      const maxRetries = 3;
      let saveSuccess = false;
      let saveError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[QR Code Async] 🔄 CORREÇÃO ULTRA-ROBUSTA - Tentativa de salvamento ${attempt}/${maxRetries}`);
          
          const { data: updateData, error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: finalQRCode,
              web_status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId)
            .select();

          if (updateError) {
            console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Erro UPDATE (tentativa ${attempt}):`, updateError);
            saveError = updateError;
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          } else if (updateData && updateData.length > 0) {
            console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - UPDATE bem-sucedido (tentativa ${attempt})`);
            
            // Verificação final
            const { data: verifyData, error: verifyError } = await supabase
              .from('whatsapp_instances')
              .select('qr_code')
              .eq('id', instanceId)
              .single();

            if (!verifyError && verifyData?.qr_code === finalQRCode) {
              console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - QR Code confirmado no banco!`);
              saveSuccess = true;
              break;
            } else {
              console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Verificação falhou (tentativa ${attempt})`);
              saveError = verifyError || new Error('QR Code não foi salvo corretamente');
            }
          } else {
            console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - UPDATE não afetou nenhuma linha (tentativa ${attempt})`);
            saveError = new Error('UPDATE não afetou nenhuma linha');
          }
          
        } catch (error) {
          console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Erro inesperado (tentativa ${attempt}):`, error);
          saveError = error;
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
        }
      }
      
      if (saveSuccess) {
        console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - QR Code salvo com sucesso após verificação!`);
        
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: finalQRCode,
            source: 'vps_converted_and_saved',
            savedToDatabase: true,
            qrId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Falha crítica no salvamento após ${maxRetries} tentativas:`, saveError);
        
        // Retornar QR Code mesmo se não conseguir salvar
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: finalQRCode,
            source: 'vps_converted_save_failed',
            savedToDatabase: false,
            saveError: saveError?.message || 'Erro desconhecido no salvamento',
            qrId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (vpsResult.waiting) {
      console.log(`[QR Code Async] ⏳ CORREÇÃO ULTRA-ROBUSTA - QR Code ainda sendo gerado`);
      
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
    console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Erro crítico [${qrId}]:`, error);
    
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
