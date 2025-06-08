
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CONFIGURAÇÃO: Servidor Webhook na porta 3002
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, instanceId } = await req.json();

    if (action === 'get_qr_with_details') {
      return await getQRWithDetails(supabase, instanceId);
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('[QR Service] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getQRWithDetails(supabase: any, instanceId: string) {
  console.log(`[QR Service] 🔍 Buscando QR Code: ${instanceId}`);

  try {
    // 1. Buscar instância no banco
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (dbError || !instance) {
      throw new Error('Instância não encontrada');
    }

    console.log(`[QR Service] 📱 Instância encontrada:`, {
      id: instance.id,
      vps_instance_id: instance.vps_instance_id,
      status: instance.connection_status
    });

    // 2. Se já temos QR Code no banco, retornar
    if (instance.qr_code && instance.connection_status === 'waiting_qr') {
      console.log(`[QR Service] ✅ QR Code disponível no banco`);
      return new Response(JSON.stringify({
        success: true,
        qrCode: instance.qr_code,
        status: instance.connection_status,
        source: 'database'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Buscar QR Code na VPS (servidor webhook 3002)
    if (instance.vps_instance_id) {
      try {
        const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instance/${instance.vps_instance_id}/qr`, {
          timeout: 10000
        });

        if (vpsResponse.ok) {
          const vpsData = await vpsResponse.json();
          
          if (vpsData.success && vpsData.qrCode) {
            console.log(`[QR Service] 📡 QR Code obtido da VPS`);
            
            // Atualizar banco com QR Code
            await supabase
              .from('whatsapp_instances')
              .update({ 
                qr_code: vpsData.qrCode,
                connection_status: 'waiting_qr',
                updated_at: new Date().toISOString()
              })
              .eq('id', instanceId);

            return new Response(JSON.stringify({
              success: true,
              qrCode: vpsData.qrCode,
              status: 'waiting_qr',
              source: 'vps_webhook_server'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (vpsError) {
        console.log(`[QR Service] ⚠️ Erro na VPS:`, vpsError.message);
      }
    }

    // 4. QR Code ainda não disponível
    console.log(`[QR Service] ⏳ QR Code ainda não disponível`);
    return new Response(JSON.stringify({
      success: false,
      waiting: true,
      status: instance.connection_status,
      message: 'QR Code ainda sendo gerado'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[QR Service] ❌ Erro:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
