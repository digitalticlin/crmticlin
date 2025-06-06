
import { corsHeaders } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';
import { normalizeQRCode, isRealQRCode } from './config.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const asyncId = `qr_${Date.now()}`;
  console.log(`[QR Code Async] 📱 FASE 1.3 - Buscando QR Code para: ${instanceData.instanceId} [${asyncId}]`);

  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    console.log(`[QR Code Async] 🔍 FASE 1.3 - Validando instance ID: ${instanceId}`);

    // 1. Buscar instância no Supabase
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      console.error(`[QR Code Async] ❌ FASE 1.3 - Instância não encontrada:`, instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    console.log(`[QR Code Async] 📋 FASE 1.3 - Instância encontrada [${asyncId}]:`, {
      id: instance.id,
      vpsInstanceId: instance.vps_instance_id,
      instanceName: instance.instance_name,
      hasExistingQR: !!instance.qr_code,
      webStatus: instance.web_status,
      connectionStatus: instance.connection_status,
      lastUpdate: instance.updated_at
    });

    // 2. Verificar se já tem QR Code válido no banco
    if (instance.qr_code && isRealQRCode(instance.qr_code)) {
      console.log(`[QR Code Async] ✅ FASE 1.3 - QR Code válido já existe no banco [${asyncId}]:`, {
        tamanho: instance.qr_code.length,
        temDataUrl: instance.qr_code.startsWith('data:image/'),
        preview: instance.qr_code.substring(0, 50) + '...'
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: normalizeQRCode(instance.qr_code),
          source: 'database',
          asyncId,
          message: 'QR Code obtido do banco de dados',
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[QR Code Async] 🔄 FASE 1.3 - QR Code não encontrado no banco, buscando da VPS... [${asyncId}]`);

    // 3. Buscar QR Code atualizado da VPS
    if (!instance.vps_instance_id) {
      console.error(`[QR Code Async] ❌ FASE 1.3 - VPS Instance ID não encontrado [${asyncId}]`);
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Code Async] 🌐 FASE 1.3 - Comunicando com VPS [${asyncId}]:`, {
      vpsInstanceId: instance.vps_instance_id,
      serverUrl: instance.server_url
    });

    const vpsResult = await getVPSInstanceQR(instance.vps_instance_id);
    
    console.log(`[QR Code Async] 📡 FASE 1.3 - Resposta da VPS [${asyncId}]:`, {
      success: vpsResult.success,
      hasQrCode: !!vpsResult.qrCode,
      qrCodeLength: vpsResult.qrCode ? vpsResult.qrCode.length : 0,
      error: vpsResult.error
    });
    
    if (!vpsResult.success) {
      // FASE 1.3: Melhor tratamento de erros de QR Code não disponível
      const isStillGenerating = vpsResult.error?.includes('ainda não foi gerado') || 
                               vpsResult.error?.includes('inicializando') ||
                               vpsResult.error?.includes('ainda não disponível') ||
                               vpsResult.error?.includes('creating');
      
      if (isStillGenerating) {
        console.log(`[QR Code Async] ⏳ FASE 1.3 - QR Code ainda sendo gerado [${asyncId}]`);
        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            error: 'QR Code ainda sendo gerado',
            message: 'A VPS ainda está inicializando a instância. Aguarde alguns segundos.',
            retryAfter: 2000,
            asyncId,
            vpsStatus: 'initializing'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error(`[QR Code Async] ❌ FASE 1.3 - Erro crítico da VPS [${asyncId}]:`, vpsResult.error);
      throw new Error(vpsResult.error || 'Falha crítica ao comunicar com VPS');
    }

    if (!vpsResult.qrCode || !isRealQRCode(vpsResult.qrCode)) {
      console.log(`[QR Code Async] ⏳ FASE 1.3 - QR Code inválido ou ainda não disponível [${asyncId}]:`, {
        hasQrCode: !!vpsResult.qrCode,
        qrCodeLength: vpsResult.qrCode ? vpsResult.qrCode.length : 0,
        isValid: vpsResult.qrCode ? isRealQRCode(vpsResult.qrCode) : false
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda não disponível',
          message: 'QR Code ainda sendo processado pela VPS',
          retryAfter: 2500,
          asyncId,
          vpsStatus: 'processing'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FASE 1.3: Normalizar e validar QR Code antes de salvar
    const normalizedQRCode = normalizeQRCode(vpsResult.qrCode);
    console.log(`[QR Code Async] ✅ FASE 1.3 - QR Code VÁLIDO obtido da VPS [${asyncId}]:`, {
      tamanhoOriginal: vpsResult.qrCode.length,
      tamanhoNormalizado: normalizedQRCode.length,
      temDataUrl: normalizedQRCode.startsWith('data:image/'),
      preview: normalizedQRCode.substring(0, 50) + '...'
    });

    // 4. Atualizar QR Code no banco
    console.log(`[QR Code Async] 💾 FASE 1.3 - Salvando QR Code no banco [${asyncId}]`);
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
      console.error('[QR Code Async] ❌ FASE 1.3 - Erro ao atualizar banco [${asyncId}]:', updateError);
      throw updateError;
    }

    console.log(`[QR Code Async] ✅ FASE 1.3 - QR Code salvo no banco com sucesso [${asyncId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: normalizedQRCode,
        source: 'vps',
        asyncId,
        message: 'QR Code obtido com sucesso da VPS',
        fresh: true,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error(`[QR Code Async] ❌ FASE 1.3 - ERRO CRÍTICO [${asyncId}]:`, {
      error: error.message,
      stack: error.stack,
      instanceId: instanceData.instanceId,
      userId
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        asyncId,
        timestamp: new Date().toISOString(),
        debug: {
          instanceId: instanceData.instanceId,
          userId,
          errorType: error.constructor.name
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
