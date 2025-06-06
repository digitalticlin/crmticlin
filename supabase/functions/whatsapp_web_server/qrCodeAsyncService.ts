
import { corsHeaders } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';
import { normalizeQRCode, isRealQRCode } from './config.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const asyncId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 FASE 1.2 - Buscando QR Code para: ${instanceData.instanceId}`);

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

    console.log(`[QR Code Async] 📋 FASE 1.2 - Instância encontrada:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name,
      hasExistingQR: !!instance.qr_code
    });

    // 2. Verificar se já tem QR Code válido no banco
    if (instance.qr_code && isRealQRCode(instance.qr_code)) {
      console.log(`[QR Code Async] ✅ FASE 1.2 - QR Code já existe no banco`);
      
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: normalizeQRCode(instance.qr_code),
          source: 'database',
          asyncId,
          message: 'QR Code obtido do banco de dados'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar QR Code atualizado da VPS
    console.log(`[QR Code Async] 🔄 FASE 1.2 - Buscando QR atualizado da VPS...`);
    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);
    
    if (!vpsResult.success) {
      // FASE 1.2: Melhor tratamento de erros de QR Code não disponível
      const isStillGenerating = vpsResult.error?.includes('ainda não foi gerado') || 
                               vpsResult.error?.includes('inicializando') ||
                               vpsResult.error?.includes('ainda não disponível');
      
      if (isStillGenerating) {
        console.log(`[QR Code Async] ⏳ FASE 1.2 - QR Code ainda sendo gerado`);
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            error: 'QR Code ainda sendo gerado',
            message: 'Aguarde alguns segundos e tente novamente',
            retryAfter: 2000 // FASE 1.2: Sugerir retry em 2 segundos
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(vpsResult.error || 'Falha ao obter QR Code da VPS');
    }

    if (!vpsResult.qrCode || !isRealQRCode(vpsResult.qrCode)) {
      console.log(`[QR Code Async] ⏳ FASE 1.2 - QR Code inválido ou ainda não disponível`);
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda não disponível',
          message: 'Aguarde alguns segundos e tente novamente',
          retryAfter: 2000
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FASE 1.2: Normalizar QR Code antes de salvar
    const normalizedQRCode = normalizeQRCode(vpsResult.qrCode);
    console.log(`[QR Code Async] ✅ FASE 1.2 - QR Code válido obtido da VPS`);

    // 4. Atualizar QR Code no banco
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: normalizedQRCode,
        web_status: 'waiting_scan',
        connection_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error('[QR Code Async] ❌ FASE 1.2 - Erro ao atualizar banco:', updateError);
      throw updateError;
    }

    console.log(`[QR Code Async] ✅ FASE 1.2 - QR Code atualizado no banco com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: normalizedQRCode,
        source: 'vps',
        asyncId,
        message: 'QR Code obtido com sucesso da VPS'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ FASE 1.2 - ERRO GERAL [${asyncId}]:`, error);
    
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
