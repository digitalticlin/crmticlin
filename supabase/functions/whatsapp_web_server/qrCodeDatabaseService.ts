
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
  console.log('[QR Database] 🎉 QR Code REAL obtido - atualizando banco (CORREÇÃO DEFINITIVA)');
  console.log('[QR Database] 📋 Instance ID para atualização:', instanceId);
  
  try {
    // CORREÇÃO DEFINITIVA: Verificar se é UUID (Supabase ID) ou string (VPS Instance ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(instanceId);
    
    let updateQuery;
    
    if (isUUID) {
      console.log('[QR Database] 🔄 Atualizando por Supabase ID (UUID)');
      updateQuery = supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);
    } else {
      console.log('[QR Database] 🔄 Atualizando por VPS Instance ID');
      updateQuery = supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: qrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('vps_instance_id', instanceId);
    }

    const { error: updateError } = await updateQuery;

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
