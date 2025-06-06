
import { corsHeaders, normalizeQRCode } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 🚀 CORREÇÃO ROBUSTA - Iniciando processo completo para: ${instanceData.instanceId} [${qrId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO ROBUSTA - Validando instance: ${instanceId}`);

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO ROBUSTA - Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] ✅ CORREÇÃO ROBUSTA - Instância encontrada:`, {
      name: instance.instance_name,
      vpsId: instance.vps_instance_id,
      hasQR: !!instance.qr_code,
      qrType: instance.qr_code?.startsWith('data:') ? 'data-url' : 'text'
    });

    // CORREÇÃO CRÍTICA: Verificar se já tem QR Code válido no banco
    if (instance.qr_code && instance.qr_code.startsWith('data:image/')) {
      console.log(`[QR Code Async] ✅ CORREÇÃO ROBUSTA - QR Code data URL já disponível`);
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

    // Validar VPS Instance ID
    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO ROBUSTA - Buscando QR Code na VPS: ${instance.vps_instance_id}`);
    
    // Buscar QR Code na VPS com timeout
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);

    if (vpsResult.success && vpsResult.qrCode) {
      console.log(`[QR Code Async] 📥 CORREÇÃO ROBUSTA - QR Code obtido da VPS:`, {
        hasQrCode: !!vpsResult.qrCode,
        qrLength: vpsResult.qrCode?.length,
        qrPreview: vpsResult.qrCode?.substring(0, 50)
      });
      
      // PROCESSO DE NORMALIZAÇÃO E SALVAMENTO ROBUSTO
      let finalQRCode: string;
      
      try {
        console.log(`[QR Code Async] 🔄 CORREÇÃO ROBUSTA - Iniciando normalização...`);
        finalQRCode = await normalizeQRCode(vpsResult.qrCode);
        console.log(`[QR Code Async] ✅ CORREÇÃO ROBUSTA - Normalização concluída:`, {
          originalLength: vpsResult.qrCode.length,
          finalLength: finalQRCode.length,
          isDataUrl: finalQRCode.startsWith('data:')
        });
      } catch (normalizeError) {
        console.error(`[QR Code Async] ❌ CORREÇÃO ROBUSTA - Falha na normalização:`, normalizeError);
        throw new Error(`Falha na normalização do QR Code: ${normalizeError.message}`);
      }

      // SALVAMENTO ULTRA-ROBUSTO NO BANCO
      console.log(`[QR Code Async] 💾 CORREÇÃO ROBUSTA - Iniciando salvamento ultra-robusto...`);
      const saveResult = await saveQRCodeUltraRobust(supabase, instanceId, finalQRCode, qrId);
      
      if (saveResult.success) {
        console.log(`[QR Code Async] ✅ CORREÇÃO ROBUSTA - QR Code salvo com sucesso!`);
        
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: finalQRCode,
            source: 'vps_converted_and_saved',
            savedToDatabase: true,
            saveAttempts: saveResult.attempts,
            qrId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error(`[QR Code Async] ❌ CORREÇÃO ROBUSTA - Falha crítica no salvamento:`, saveResult.error);
        
        // Retornar QR Code mesmo se não conseguir salvar
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: finalQRCode,
            source: 'vps_converted_save_failed',
            savedToDatabase: false,
            saveError: saveResult.error,
            qrId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (vpsResult.waiting) {
      console.log(`[QR Code Async] ⏳ CORREÇÃO ROBUSTA - QR Code ainda sendo gerado`);
      
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
    console.error(`[QR Code Async] ❌ CORREÇÃO ROBUSTA - Erro crítico [${qrId}]:`, error);
    
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

// CORREÇÃO ULTRA-ROBUSTA: Função de salvamento com múltiplas estratégias
async function saveQRCodeUltraRobust(supabase: any, instanceId: string, qrCode: string, qrId: string, maxAttempts = 5) {
  console.log(`[Save Ultra-Robust] 🚀 CORREÇÃO ULTRA - Iniciando salvamento para ${instanceId} [${qrId}]`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Save Ultra-Robust] 🔄 CORREÇÃO ULTRA - Tentativa ${attempt}/${maxAttempts}`);
      
      // ESTRATÉGIA 1: UPDATE direto
      const { data: updateData, error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId)
        .select();

      if (updateError) {
        console.error(`[Save Ultra-Robust] ❌ CORREÇÃO ULTRA - Erro UPDATE (tentativa ${attempt}):`, updateError);
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `UPDATE falhou após ${maxAttempts} tentativas: ${updateError.message}`,
            attempts: attempt
          };
        }
        
        // Aguardar antes do retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      console.log(`[Save Ultra-Robust] 📊 CORREÇÃO ULTRA - UPDATE executado:`, {
        affectedRows: updateData?.length || 0,
        attempt
      });

      // VALIDAÇÃO CRÍTICA: Confirmar que o UPDATE funcionou
      if (!updateData || updateData.length === 0) {
        console.error(`[Save Ultra-Robust] ❌ CORREÇÃO ULTRA - UPDATE não afetou nenhuma linha (tentativa ${attempt})`);
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: 'UPDATE não afetou nenhuma linha após todas as tentativas',
            attempts: attempt
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
        continue;
      }

      // VERIFICAÇÃO FINAL: Confirmar dados no banco
      console.log(`[Save Ultra-Robust] 🔍 CORREÇÃO ULTRA - Verificando dados salvos...`);
      const { data: verifyData, error: verifyError } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, updated_at, web_status')
        .eq('id', instanceId)
        .single();

      if (verifyError) {
        console.error(`[Save Ultra-Robust] ❌ CORREÇÃO ULTRA - Erro verificação (tentativa ${attempt}):`, verifyError);
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `Verificação falhou após ${maxAttempts} tentativas: ${verifyError.message}`,
            attempts: attempt
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      // Validar se os dados foram salvos corretamente
      const qrMatches = verifyData?.qr_code === qrCode;
      const statusCorrect = verifyData?.web_status === 'waiting_scan';
      
      if (qrMatches && statusCorrect) {
        console.log(`[Save Ultra-Robust] ✅ CORREÇÃO ULTRA - Dados confirmados no banco (tentativa ${attempt})`);
        return {
          success: true,
          data: verifyData,
          attempts: attempt
        };
      } else {
        console.error(`[Save Ultra-Robust] ❌ CORREÇÃO ULTRA - Dados não conferem (tentativa ${attempt}):`, {
          qrMatches,
          statusCorrect,
          expectedLength: qrCode.length,
          actualLength: verifyData?.qr_code?.length || 0
        });
        
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: 'Dados não foram salvos corretamente após todas as tentativas',
            attempts: attempt
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 2500 * attempt));
        continue;
      }

    } catch (error: any) {
      console.error(`[Save Ultra-Robust] ❌ CORREÇÃO ULTRA - Erro inesperado (tentativa ${attempt}):`, error);
      
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: `Erro inesperado após ${maxAttempts} tentativas: ${error.message}`,
          attempts: attempt
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
    }
  }

  return {
    success: false,
    error: 'Todas as tentativas de salvamento falharam',
    attempts: maxAttempts
  };
}
