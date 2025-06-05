
import { WhatsAppInstance, QRData } from './types.ts';

export async function processQRUpdate(supabase: any, instance: WhatsAppInstance, qrData: QRData) {
  console.log('[QR Processor] 🔳 Processing QR Code update');
  
  try {
    const { qr } = qrData;
    
    if (qr) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qr,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error('[QR Processor] ❌ Error updating QR:', updateError);
        throw updateError;
      }

      console.log('[QR Processor] ✅ QR Code updated');
    }

    return {
      success: true,
      processed: true
    };

  } catch (error) {
    console.error('[QR Processor] ❌ Error processing QR:', error);
    throw error;
  }
}
