
import { VPS_CONFIG, getVPSHeaders, isRealQRCode } from './config.ts';
import { corsHeaders } from './config.ts';

async function makeVPSRequest(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // 15 second timeout para QR requests
      });
      
      return response;
    } catch (error) {
      console.error(`[QR Async] Error (attempt ${i + 1}):`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function getQRCodeAsync(supabase: any, instanceId: string, userId: string) {
  console.log(`[QR Async] 📱 Obtendo QR Code assíncrono para instância: ${instanceId}`);
  
  try {
    // Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, company_id, qr_code')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Verificar se usuário tem acesso à instância
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profile?.company_id !== instance.company_id) {
      throw new Error('Acesso negado à instância');
    }

    // Se já tem QR Code válido, retornar
    if (instance.qr_code && isRealQRCode(instance.qr_code)) {
      console.log('[QR Async] ✅ QR Code já disponível no banco');
      return new Response(
        JSON.stringify({
          success: true,
          qrCode: instance.qr_code,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tentar obter QR Code da VPS
    if (instance.vps_instance_id) {
      console.log('[QR Async] 🔄 Buscando QR Code na VPS...');
      
      const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/qr`, {
        method: 'POST',
        headers: getVPSHeaders(),
        body: JSON.stringify({ instanceId: instance.vps_instance_id })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.qrCode && isRealQRCode(data.qrCode)) {
          console.log('[QR Async] ✅ QR Code obtido da VPS - atualizando banco');
          
          // Atualizar QR Code no banco
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({ qr_code: data.qrCode })
            .eq('id', instanceId);

          if (updateError) {
            console.error('[QR Async] ⚠️ Erro ao atualizar QR Code no banco:', updateError);
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: data.qrCode,
              cached: false
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log('[QR Async] ⏳ QR Code ainda não está pronto na VPS');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'QR Code ainda não disponível - tente novamente em alguns segundos',
              waiting: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const errorText = await response.text();
        console.error(`[QR Async] ❌ Erro VPS: ${response.status} - ${errorText}`);
        throw new Error(`VPS QR request failed: ${response.status} - ${errorText}`);
      }
    } else {
      throw new Error('VPS instance ID não encontrado');
    }

  } catch (error: any) {
    console.error('[QR Async] 💥 Erro ao obter QR Code:', error);
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
