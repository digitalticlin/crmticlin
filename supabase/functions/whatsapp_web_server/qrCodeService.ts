
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequest.ts';

export async function getQRCodeAsync(supabase: any, instanceData: any, userId: string) {
  const qrId = `qr_${Date.now()}`;
  console.log(`[QR Code] 📱 Buscando QR Code [${qrId}]:`, instanceData);
  
  try {
    const { instanceId } = instanceData;
    
    if (!instanceId) {
      throw new Error('Instance ID é obrigatório');
    }

    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('created_by_user_id', userId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada ou sem permissão');
    }

    // Verificar se já existe QR Code válido no banco
    if (instance.qr_code && instance.updated_at) {
      const qrAge = Date.now() - new Date(instance.updated_at).getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutos
      
      if (qrAge < maxAge) {
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: instance.qr_code,
            source: 'database',
            instanceId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar da VPS
    const vpsResponse = await makeVPSRequest(`/instance/${instance.vps_instance_id}/qr`, 'GET');

    if (vpsResponse.success && vpsResponse.data?.qrCode) {
      // Normalizar QR Code
      let normalizedQrCode = vpsResponse.data.qrCode;
      if (!normalizedQrCode.startsWith('data:image/')) {
        normalizedQrCode = `data:image/png;base64,${normalizedQrCode}`;
      }

      // Salvar no banco
      await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: normalizedQrCode,
          web_status: 'waiting_scan',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: normalizedQrCode,
          source: 'vps',
          instanceId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda sendo gerado',
          instanceId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error(`[QR Code] ❌ Erro [${qrId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        qrId
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function saveQRCodeToDatabase(supabase: any, qrData: any, userId: string) {
  try {
    const { instanceId, qrCode } = qrData;
    
    if (!instanceId || !qrCode) {
      throw new Error('Instance ID e QR Code são obrigatórios');
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        web_status: 'waiting_scan',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .eq('created_by_user_id', userId);

    if (error) {
      throw new Error(`Erro ao salvar QR Code: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'QR Code salvo com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
