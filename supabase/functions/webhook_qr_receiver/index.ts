
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
    const payload = await req.json();
    console.log("📱 [QR Webhook] Payload recebido:", JSON.stringify(payload, null, 2));

    // Verificar se é evento de QR Code
    if (payload.event === "qrcode.updated" && payload.data) {
      const { instance, qrcode } = payload.data;
      
      if (!instance || !qrcode) {
        console.error("❌ [QR Webhook] Dados incompletos:", { instance, qrcode: !!qrcode });
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Instance ou QR Code ausente" 
        }), { 
          headers: corsHeaders, 
          status: 400 
        });
      }

      console.log(`📱 [QR Webhook] Atualizando QR Code para instância: ${instance}`);

      // Atualizar instância com QR Code
      const { data: updatedInstance, error } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: qrcode,
          connection_status: 'waiting_qr',
          web_status: 'qr_ready',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instance)
        .select()
        .single();

      if (error) {
        console.error("❌ [QR Webhook] Erro ao atualizar instância:", error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), { 
          headers: corsHeaders, 
          status: 500 
        });
      }

      console.log("✅ [QR Webhook] QR Code atualizado com sucesso:", updatedInstance?.id);

      return new Response(JSON.stringify({
        success: true,
        message: "QR Code atualizado com sucesso",
        instanceId: updatedInstance?.id
      }), { headers: corsHeaders });
    }

    // Verificar se é evento de conexão
    if (payload.event === "connection.update" && payload.data) {
      const { instance, state } = payload.data;
      
      console.log(`🔄 [QR Webhook] Atualizando status de conexão: ${instance} -> ${state}`);

      let connectionStatus = 'disconnected';
      let webStatus = 'disconnected';

      switch (state) {
        case 'open':
        case 'connected':
          connectionStatus = 'connected';
          webStatus = 'connected';
          break;
        case 'connecting':
          connectionStatus = 'connecting';
          webStatus = 'connecting';
          break;
        case 'close':
        case 'disconnected':
          connectionStatus = 'disconnected';
          webStatus = 'disconnected';
          break;
      }

      const updateData: any = {
        connection_status: connectionStatus,
        web_status: webStatus,
        updated_at: new Date().toISOString()
      };

      if (connectionStatus === 'connected') {
        updateData.date_connected = new Date().toISOString();
        updateData.qr_code = null; // Limpar QR Code após conexão
      }

      const { error } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('instance_name', instance);

      if (error) {
        console.error("❌ [QR Webhook] Erro ao atualizar status:", error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message 
        }), { 
          headers: corsHeaders, 
          status: 500 
        });
      }

      console.log(`✅ [QR Webhook] Status atualizado: ${instance} -> ${connectionStatus}`);

      return new Response(JSON.stringify({
        success: true,
        message: "Status de conexão atualizado",
        connectionStatus
      }), { headers: corsHeaders });
    }

    console.log("ℹ️ [QR Webhook] Evento não processado:", payload.event);
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Evento recebido mas não processado" 
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ [QR Webhook] Erro geral:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno" 
    }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }
});
