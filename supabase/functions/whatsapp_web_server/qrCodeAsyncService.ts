
import { corsHeaders } from './config.ts';
import { getVPSInstanceQR } from './vpsRequestService.ts';

export async function getQRCodeAsync(supabase: any, instanceId: string, userId: string) {
  console.log('[QR Code Async] 📱 Buscando QR Code para:', instanceId);
  
  try {
    // 1. Buscar instância no banco
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      console.error('[QR Code Async] ❌ Instância não encontrada:', instanceError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Instância não encontrada'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Verificar se usuário tem acesso à instância
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userProfile?.company_id !== instance.company_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Acesso negado à instância'
        }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Se já tem QR code no banco e é recente (menos de 5 min), retornar
    if (instance.qr_code && instance.updated_at) {
      const lastUpdate = new Date(instance.updated_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      
      if (diffMinutes < 5) {
        console.log('[QR Code Async] ✅ QR Code do banco (ainda válido)');
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: instance.qr_code,
            source: 'database'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Buscar QR code atualizado da VPS
    if (instance.vps_instance_id) {
      console.log('[QR Code Async] 🔄 Buscando QR atualizado da VPS...');
      const vpsQRResult = await getVPSInstanceQR(instance.vps_instance_id);
      
      if (vpsQRResult.success && vpsQRResult.qrCode) {
        // Atualizar QR no banco
        await supabase
          .from('whatsapp_instances')
          .update({
            qr_code: vpsQRResult.qrCode,
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId);

        console.log('[QR Code Async] ✅ QR Code atualizado da VPS');
        return new Response(
          JSON.stringify({
            success: true,
            qrCode: vpsQRResult.qrCode,
            source: 'vps'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Se chegou aqui, QR não está disponível
    console.log('[QR Code Async] ⏳ QR Code ainda não disponível');
    return new Response(
      JSON.stringify({
        success: false,
        waiting: true,
        error: 'QR Code ainda não disponível',
        message: 'Aguarde alguns segundos e tente novamente'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[QR Code Async] ❌ Erro:', error);
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
