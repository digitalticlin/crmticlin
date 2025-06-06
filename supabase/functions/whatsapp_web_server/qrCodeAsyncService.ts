
import { corsHeaders, normalizeQRCode } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 CORREÇÃO ESTRATÉGICA - Buscando QR Code para: ${instanceData.instanceId} [${qrId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 CORREÇÃO ESTRATÉGICA - Validando instance ID: ${instanceId}`);

    // Buscar instância baseada no created_by_user_id
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ CORREÇÃO ESTRATÉGICA - Instância não encontrada [${qrId}]:`, instanceError);
      throw new Error('Instância não encontrada ou não pertence ao usuário');
    }

    console.log(`[QR Code Async] ✅ CORREÇÃO ESTRATÉGICA - Instância encontrada: ${instance.instance_name} (VPS ID: ${instance.vps_instance_id})`);

    // CORREÇÃO CRÍTICA: Verificar se já tem QR Code válido no banco (data URL)
    if (instance.qr_code && instance.qr_code.startsWith('data:image/')) {
      console.log(`[QR Code Async] ✅ CORREÇÃO ESTRATÉGICA - QR Code data URL já disponível no banco`);
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          source: 'database_converted'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar QR Code na VPS
    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Code Async] 🌐 CORREÇÃO ESTRATÉGICA - Buscando QR Code na VPS: ${instance.vps_instance_id}`);
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);

    if (vpsResult.success && vpsResult.qrCode) {
      console.log(`[QR Code Async] ✅ CORREÇÃO ESTRATÉGICA - QR Code obtido e convertido, salvando no banco...`);
      
      // CORREÇÃO CRÍTICA: Implementar save robusto com retry e validação
      const saveResult = await saveQRCodeToDatabase(supabase, instanceId, vpsResult.qrCode, qrId);
      
      if (saveResult.success) {
        console.log(`[QR Code Async] ✅ CORREÇÃO ESTRATÉGICA - QR Code persistido com sucesso no banco`);
        
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: vpsResult.qrCode,
            source: 'vps_converted_and_saved',
            savedToDatabase: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error(`[QR Code Async] ❌ CORREÇÃO ESTRATÉGICA - Falha na persistência:`, saveResult.error);
        
        // Retornar QR Code mesmo se não conseguir salvar, mas marcar como não persistido
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: vpsResult.qrCode,
            source: 'vps_converted_not_saved',
            savedToDatabase: false,
            saveError: saveResult.error
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (vpsResult.waiting) {
      console.log(`[QR Code Async] ⏳ CORREÇÃO ESTRATÉGICA - QR Code ainda sendo gerado na VPS`);
      
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
    console.error(`[QR Code Async] ❌ CORREÇÃO ESTRATÉGICA - Erro geral [${qrId}]:`, error);
    
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

// CORREÇÃO CRÍTICA: Nova função dedicada para salvar QR Code com retry
async function saveQRCodeToDatabase(supabase: any, instanceId: string, qrCode: string, qrId: string, maxRetries = 3) {
  console.log(`[Save QR Code] 💾 CORREÇÃO ESTRATÉGICA - Iniciando save para ${instanceId} [${qrId}]`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Save QR Code] 🔄 CORREÇÃO ESTRATÉGICA - Tentativa ${attempt}/${maxRetries} de save`);
      
      // Atualizar QR Code no banco
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
        console.error(`[Save QR Code] ❌ CORREÇÃO ESTRATÉGICA - Erro no UPDATE (tentativa ${attempt}):`, updateError);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Falha no UPDATE após ${maxRetries} tentativas: ${updateError.message}`
          };
        }
        
        // Aguardar antes do próximo retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      console.log(`[Save QR Code] 📋 CORREÇÃO ESTRATÉGICA - UPDATE executado, dados retornados:`, updateData);

      // VALIDAÇÃO CRÍTICA: Verificar se o UPDATE realmente funcionou
      if (!updateData || updateData.length === 0) {
        console.error(`[Save QR Code] ❌ CORREÇÃO ESTRATÉGICA - UPDATE não afetou nenhuma linha (tentativa ${attempt})`);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: 'UPDATE não afetou nenhuma linha após todas as tentativas'
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // VALIDAÇÃO FINAL: Confirmar que o QR Code foi realmente salvo
      const { data: verifyData, error: verifyError } = await supabase
        .from('whatsapp_instances')
        .select('qr_code, updated_at')
        .eq('id', instanceId)
        .single();

      if (verifyError) {
        console.error(`[Save QR Code] ❌ CORREÇÃO ESTRATÉGICA - Erro na verificação (tentativa ${attempt}):`, verifyError);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Falha na verificação após ${maxRetries} tentativas: ${verifyError.message}`
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      if (verifyData?.qr_code === qrCode) {
        console.log(`[Save QR Code] ✅ CORREÇÃO ESTRATÉGICA - QR Code confirmado no banco (tentativa ${attempt})`);
        return {
          success: true,
          data: verifyData,
          attempt
        };
      } else {
        console.error(`[Save QR Code] ❌ CORREÇÃO ESTRATÉGICA - QR Code não confere na verificação (tentativa ${attempt})`);
        console.error(`[Save QR Code] 📊 Esperado: ${qrCode.substring(0, 50)}...`);
        console.error(`[Save QR Code] 📊 Encontrado: ${verifyData?.qr_code?.substring(0, 50)}...`);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: 'QR Code não foi salvo corretamente após todas as tentativas'
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

    } catch (error: any) {
      console.error(`[Save QR Code] ❌ CORREÇÃO ESTRATÉGICA - Erro inesperado (tentativa ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Erro inesperado após ${maxRetries} tentativas: ${error.message}`
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return {
    success: false,
    error: 'Todas as tentativas de save falharam'
  };
}
