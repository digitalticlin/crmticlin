
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { instanceId } = await req.json();
    console.log(`🔄 [QR Manager] Solicitando QR Code para instância: ${instanceId}`);

    if (!instanceId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "ID da instância é obrigatório" 
      }), { 
        headers: corsHeaders, 
        status: 400 
      });
    }

    // Buscar instância no banco
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error("❌ [QR Manager] Instância não encontrada:", fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada" 
      }), { 
        headers: corsHeaders, 
        status: 404 
      });
    }

    console.log(`🌐 [QR Manager] Solicitando QR Code para VPS: ${instance.instance_name}`);

    // CORREÇÃO: Usar URL correta na porta 3002 e endpoint correto
    const vpsUrl = "http://31.97.24.222:3002";
    const vpsToken = Deno.env.get('VPS_API_TOKEN') || '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3';
    const response = await fetch(`${vpsUrl}/instance/${instance.instance_name}/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      }
    });

    const vpsResult = await response.json();
    console.log(`📱 [QR Manager] Resposta da VPS:`, vpsResult);

    if (response.ok && (vpsResult.qr || vpsResult.qrcode)) {
      const qrCode = vpsResult.qr || vpsResult.qrcode;
      // Atualizar instância com QR Code
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrCode,
          connection_status: 'waiting_qr',
          web_status: 'qr_ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (updateError) {
        console.error("❌ [QR Manager] Erro ao atualizar QR Code:", updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: updateError.message 
        }), { 
          headers: corsHeaders, 
          status: 500 
        });
      }

      console.log(`✅ [QR Manager] QR Code obtido e salvo: ${instanceId}`);

      return new Response(JSON.stringify({
        success: true,
        qrCode: qrCode,
        message: "QR Code obtido com sucesso"
      }), { headers: corsHeaders });
    }

    // Se não tem QR Code, verificar se já está conectado
    if (vpsResult.state === 'open' || vpsResult.connected) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          connection_status: 'connected',
          web_status: 'connected',
          date_connected: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (!updateError) {
        console.log(`✅ [QR Manager] Instância já conectada: ${instanceId}`);
        return new Response(JSON.stringify({
          success: true,
          connected: true,
          message: "Instância já está conectada"
        }), { headers: corsHeaders });
      }
    }

    console.log(`⏳ [QR Manager] QR Code ainda não disponível: ${instanceId}`);
    return new Response(JSON.stringify({
      success: false,
      waiting: true,
      message: "QR Code ainda não está disponível"
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ [QR Manager] Erro geral:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor" 
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
