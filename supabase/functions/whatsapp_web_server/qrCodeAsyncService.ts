
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
      console.log(`[QR Code Async] 📥 CORREÇÃO ULTRA-ROBUSTA - QR Code obtido da VPS: ${vpsResult.qrCode.substring(0, 100)}`);
      
      let finalQRCode: string;
      
      try {
        console.log(`[QR Code Async] 🔄 CORREÇÃO ULTRA-ROBUSTA - Tentando normalizar QR Code...`);
        finalQRCode = await normalizeQRCode(vpsResult.qrCode);
        console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - Normalização concluída com sucesso`);
      } catch (normalizeError) {
        console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Falha na normalização:`, normalizeError);
        
        // FALLBACK CRÍTICO: Se normalização falhar, usar QR Code original
        console.log(`[QR Code Async] 🔄 CORREÇÃO ULTRA-ROBUSTA - Usando QR Code original da VPS como fallback`);
        finalQRCode = vpsResult.qrCode;
      }

      // SALVAMENTO MEGA ULTRA-ROBUSTO NO BANCO
      console.log(`[QR Code Async] 💾 CORREÇÃO ULTRA-ROBUSTA - Iniciando salvamento MEGA ROBUSTO...`);
      
      const maxRetries = 5; // Aumentado para 5 tentativas
      let saveSuccess = false;
      let saveError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[QR Code Async] 🔄 CORREÇÃO ULTRA-ROBUSTA - MEGA TENTATIVA ${attempt}/${maxRetries}`);
          
          // ESTRATÉGIA 1: UPDATE direto
          const { data: updateData, error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({ 
              qr_code: finalQRCode,
              web_status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', instanceId)
            .select('qr_code, updated_at');

          if (updateError) {
            console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - UPDATE falhou (tentativa ${attempt}):`, updateError);
            saveError = updateError;
          } else if (updateData && updateData.length > 0) {
            console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - UPDATE retornou dados (tentativa ${attempt}):`, {
              hasQRCode: !!updateData[0]?.qr_code,
              qrLength: updateData[0]?.qr_code?.length || 0,
              updatedAt: updateData[0]?.updated_at
            });
            
            // VERIFICAÇÃO MEGA ROBUSTA
            await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
            
            const { data: verifyData, error: verifyError } = await supabase
              .from('whatsapp_instances')
              .select('qr_code, updated_at')
              .eq('id', instanceId)
              .single();

            if (!verifyError && verifyData?.qr_code) {
              console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - VERIFICAÇÃO CONFIRMADA (tentativa ${attempt})!`, {
                qrLength: verifyData.qr_code.length,
                updatedAt: verifyData.updated_at,
                qrPreview: verifyData.qr_code.substring(0, 50)
              });
              saveSuccess = true;
              break;
            } else {
              console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - VERIFICAÇÃO FALHOU (tentativa ${attempt}):`, {
                verifyError,
                hasQRInVerify: !!verifyData?.qr_code
              });
              saveError = verifyError || new Error('QR Code não persistiu na verificação');
            }
          } else {
            console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - UPDATE não retornou dados (tentativa ${attempt})`);
            saveError = new Error('UPDATE não retornou dados');
          }
          
        } catch (error) {
          console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - Erro inesperado (tentativa ${attempt}):`, error);
          saveError = error;
        }
        
        if (attempt < maxRetries) {
          const delay = 2000 * attempt; // Delay progressivo: 2s, 4s, 6s, 8s, 10s
          console.log(`[QR Code Async] ⏳ CORREÇÃO ULTRA-ROBUSTA - Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (saveSuccess) {
        console.log(`[QR Code Async] ✅ CORREÇÃO ULTRA-ROBUSTA - QR Code DEFINITIVAMENTE SALVO após ${maxRetries} tentativas!`);
        
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
        console.error(`[QR Code Async] ❌ CORREÇÃO ULTRA-ROBUSTA - FALHA CRÍTICA após ${maxRetries} tentativas:`, saveError);
        
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
