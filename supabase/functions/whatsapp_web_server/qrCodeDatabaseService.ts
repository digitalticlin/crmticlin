
import { isRealQRCode, corsHeaders } from './config.ts';

export async function checkCachedQRCode(instance: any) {
  console.log('[QR Database] 📋 Verificando QR Code existente...');
  
  if (instance.qr_code && isRealQRCode(instance.qr_code)) {
    console.log('[QR Database] ✅ QR Code já disponível no banco (CACHE HIT)');
    return {
      success: true,
      qrCode: instance.qr_code,
      cached: true,
      instanceName: instance.instance_name,
      message: 'QR Code obtido do cache'
    };
  }

  console.log('[QR Database] ⚠️ QR Code não disponível no cache');
  return null;
}

export async function updateQRCodeInDatabase(supabase: any, instanceId: string, qrCode: string) {
  console.log('[QR Database] 🎉 QR Code REAL obtido - atualizando banco');
  
  try {
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        qr_code: qrCode,
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      console.error('[QR Database] ⚠️ Erro ao atualizar QR Code no banco:', updateError);
      return false;
    } else {
      console.log('[QR Database] ✅ QR Code atualizado no banco com sucesso');
      return true;
    }
  } catch (updateError) {
    console.error('[QR Database] ⚠️ Erro na atualização do banco:', updateError);
    return false;
  }
}
