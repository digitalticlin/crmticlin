
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CORREÇÃO: Apenas porta 3002
const VPS_SERVER_URL = 'http://31.97.24.222:3002';
const VPS_AUTH_TOKEN = '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    );

    if (userError || !user) {
      console.log('[QR Service] ❌ Usuário não autenticado:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado' }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log(`[QR Service] ✅ Usuário autenticado: ${user.id}`);

    const requestBody = await req.json();
    const { action } = requestBody;

    console.log(`[QR Service] 📥 Ação: ${action}`);

    // CORREÇÃO: Ação para salvar QR Code direto da VPS
    if (action === 'save_qr_code') {
      const { vps_instance_id, qr_code } = requestBody;
      
      console.log(`[QR Service] 💾 Salvando QR Code para VPS instance: ${vps_instance_id}`);
      
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qr_code,
          web_status: 'waiting_scan',
          connection_status: 'waiting_qr',
          updated_at: new Date().toISOString()
        })
        .eq('vps_instance_id', vps_instance_id);

      if (updateError) {
        console.error('[QR Service] ❌ Erro ao salvar QR Code:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao salvar QR Code' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('[QR Service] ✅ QR Code salvo no banco com sucesso');
      return new Response(
        JSON.stringify({ success: true, message: 'QR Code salvo' }),
        { headers: corsHeaders }
      );
    }

    // CORREÇÃO: Buscar QR Code otimizado (banco + fallback VPS)
    if (action === 'get_qr_code' || action === 'get_qr_code_v3') {
      const { instanceId } = requestBody;
      
      console.log(`[QR Service] 📱 Buscando QR Code para: ${instanceId}`);

      // Buscar instância no banco
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('id', instanceId)
        .eq('created_by_user_id', user.id)
        .single();

      if (instanceError || !instance) {
        console.error(`[QR Service] ❌ Instância não encontrada:`, instanceError);
        return new Response(
          JSON.stringify({ success: false, error: 'Instância não encontrada' }),
          { status: 404, headers: corsHeaders }
        );
      }

      console.log(`[QR Service] 📋 Instância encontrada:`, {
        id: instance.id,
        vps_instance_id: instance.vps_instance_id,
        status: instance.connection_status,
        hasQR: !!instance.qr_code
      });

      // PRIORIDADE 1: QR Code válido no banco (últimos 5 minutos)
      if (instance.qr_code && instance.updated_at) {
        const qrAge = Date.now() - new Date(instance.updated_at).getTime();
        const maxAge = 5 * 60 * 1000; // 5 minutos
        
        if (qrAge < maxAge && instance.qr_code.startsWith('data:image/')) {
          console.log(`[QR Service] ✅ QR Code válido do banco (${Math.round(qrAge/1000)}s)`);
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: instance.qr_code,
              source: 'database',
              instanceId,
              instanceName: instance.instance_name,
              age: Math.round(qrAge/1000)
            }),
            { headers: corsHeaders }
          );
        }
      }

      // PRIORIDADE 2: Buscar da VPS
      try {
        console.log(`[QR Service] 🌐 CORREÇÃO: Buscando da VPS porta 3002: ${instance.vps_instance_id}`);
        
        const vpsResponse = await fetch(`${VPS_SERVER_URL}/instance/${instance.vps_instance_id}/qr`, {
          headers: {
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`
          },
          signal: AbortSignal.timeout(8000)
        });

        if (vpsResponse.ok) {
          const vpsData = await vpsResponse.json();
          
          if (vpsData.success && vpsData.qrCode) {
            // Normalizar QR Code
            let normalizedQrCode = vpsData.qrCode;
            if (!normalizedQrCode.startsWith('data:image/')) {
              normalizedQrCode = `data:image/png;base64,${normalizedQrCode}`;
            }

            // Salvar no banco
            const { error: updateError } = await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: normalizedQrCode,
                web_status: 'waiting_scan',
                connection_status: 'waiting_qr',
                updated_at: new Date().toISOString()
              })
              .eq('id', instanceId);

            if (!updateError) {
              console.log(`[QR Service] ✅ QR Code da VPS salvo no banco`);
            }

            return new Response(
              JSON.stringify({
                success: true,
                qrCode: normalizedQrCode,
                source: 'vps',
                instanceId,
                instanceName: instance.instance_name
              }),
              { headers: corsHeaders }
            );
          }
        }
      } catch (error) {
        console.error(`[QR Service] ❌ Erro ao buscar da VPS:`, error.message);
      }

      // QR Code ainda não disponível
      console.log(`[QR Service] ⏳ QR Code ainda sendo gerado`);
      return new Response(
        JSON.stringify({
          success: false,
          waiting: true,
          error: 'QR Code ainda sendo gerado',
          instanceId,
          instanceName: instance.instance_name,
          status: instance.connection_status
        }),
        { headers: corsHeaders }
      );
    }

    // Refresh QR Code - CORREÇÃO: usando apenas porta 3002
    if (action === 'refresh_qr_code') {
      const { instanceId } = requestBody;
      
      console.log(`[QR Service] 🔄 Refresh QR para: ${instanceId}`);

      // Buscar instância para ter o vps_instance_id
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('vps_instance_id')
        .eq('id', instanceId)
        .eq('created_by_user_id', user.id)
        .single();
        
      if (instanceError || !instance || !instance.vps_instance_id) {
        console.error(`[QR Service] ❌ Instância não encontrada:`, instanceError);
        return new Response(
          JSON.stringify({ success: false, error: 'Instância não encontrada' }),
          { status: 404, headers: corsHeaders }
        );
      }

      // Limpar QR Code atual
      const { error: clearError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: null,
          web_status: 'initializing',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId)
        .eq('created_by_user_id', user.id);

      if (clearError) {
        console.error('[QR Service] ❌ Erro ao limpar QR:', clearError);
      }

      // CORREÇÃO: Tentar forçar regeneração de QR na VPS (porta 3002)
      try {
        // Esta chamada pode falhar se o endpoint não existir, mas tentaremos mesmo assim
        await fetch(`${VPS_SERVER_URL}/instance/${instance.vps_instance_id}/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: 'regenerate_qr' }),
          signal: AbortSignal.timeout(5000)
        }).catch(e => console.error('[QR Service] Erro no refresh VPS (ignorando):', e));
      } catch (e) {
        console.error('[QR Service] Erro no refresh VPS (ignorando):', e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'QR Code limpo, novo será gerado automaticamente',
          port: 3002
        }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação não reconhecida' }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error(`[QR Service] ❌ Erro geral:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
})
