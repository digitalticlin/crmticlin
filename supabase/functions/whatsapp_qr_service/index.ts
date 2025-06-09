
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Servidor Webhook na porta 3002 com diagnóstico
const WEBHOOK_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
const VPS_TIMEOUT = 20000; // 20 segundos para QR codes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticação como no instance_manager
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[QR Service] ❌ Erro de autenticação:', authError);
      throw new Error('Usuário não autenticado');
    }

    console.log('[QR Service] ✅ Usuário autenticado:', user.id);

    const { action, instanceId } = await req.json();
    console.log(`[QR Service] 📥 Ação recebida: ${action} para instância: ${instanceId}`);

    // CORREÇÃO: Implementar TODAS as ações que o frontend está chamando
    if (action === 'get_qr_code') {
      return await getQRCode(supabase, instanceId);
    }

    if (action === 'refresh_qr_code') {
      return await refreshQRCode(supabase, instanceId);
    }

    if (action === 'get_qr_with_details') {
      return await getQRWithDetails(supabase, instanceId);
    }

    if (action === 'generate_qr') {
      return await generateQR(supabase, instanceId);
    }

    if (action === 'get_qr') {
      return await getQRCode(supabase, instanceId);
    }

    throw new Error(`Ação não reconhecida: ${action}`);

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

// CORREÇÃO: Função principal de busca QR com diagnóstico avançado
async function getQRCode(supabase: any, instanceId: string) {
  console.log(`[QR Service] 🔍 DIAGNÓSTICO: Buscando QR Code: ${instanceId}`);

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
      status: instance.connection_status,
      hasQR: !!instance.qr_code
    });

    // 2. Se já temos QR Code no banco e instância está aguardando, retornar
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

    // 3. Buscar QR Code na VPS com diagnóstico
    if (instance.vps_instance_id) {
      try {
        console.log(`[QR Service] 📡 DIAGNÓSTICO: Tentando VPS para ${instance.vps_instance_id}`);
        
        const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instance/${instance.vps_instance_id}/qr`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-QR-Service/2.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(VPS_TIMEOUT)
        });

        console.log(`[QR Service] 📥 VPS respondeu: HTTP ${vpsResponse.status}`);

        if (vpsResponse.ok) {
          const vpsData = await vpsResponse.json();
          console.log(`[QR Service] 📋 Dados VPS:`, {
            success: vpsData.success,
            hasQR: !!vpsData.qrCode,
            status: vpsData.status
          });
          
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
              source: 'vps_diagnostic_success'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          const errorText = await vpsResponse.text();
          console.log(`[QR Service] ⚠️ VPS HTTP ${vpsResponse.status}:`, errorText.substring(0, 200));
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

// CORREÇÃO: Refresh QR Code com endpoint correto
async function refreshQRCode(supabase: any, instanceId: string) {
  console.log(`[QR Service] 🔄 DIAGNÓSTICO: Refresh QR Code: ${instanceId}`);

  try {
    const { data: instance, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (dbError || !instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.vps_instance_id) {
      throw new Error('VPS Instance ID não encontrado');
    }

    console.log(`[QR Service] 🔄 Tentando refresh na VPS para: ${instance.vps_instance_id}`);

    // Tentar endpoint de refresh na VPS
    const vpsResponse = await fetch(`${WEBHOOK_SERVER_URL}/instance/${instance.vps_instance_id}/qr/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-QR-Refresh/2.0'
      },
      body: JSON.stringify({
        instanceId: instance.vps_instance_id,
        forceRefresh: true
      }),
      signal: AbortSignal.timeout(VPS_TIMEOUT)
    });

    console.log(`[QR Service] 📥 Refresh VPS respondeu: HTTP ${vpsResponse.status}`);

    if (vpsResponse.ok) {
      const vpsData = await vpsResponse.json();
      
      if (vpsData.success && vpsData.qrCode) {
        // Atualizar banco
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
          qrCode: vpsData.qrCode
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      const errorText = await vpsResponse.text();
      console.log(`[QR Service] ❌ Refresh falhou:`, errorText.substring(0, 200));
    }

    throw new Error(`VPS refresh falhou com status ${vpsResponse.status}`);

  } catch (error) {
    console.error(`[QR Service] ❌ Erro no refresh:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Alias para getQRCode
async function getQRWithDetails(supabase: any, instanceId: string) {
  return await getQRCode(supabase, instanceId);
}

// Alias para refreshQRCode
async function generateQR(supabase: any, instanceId: string) {
  return await refreshQRCode(supabase, instanceId);
}
