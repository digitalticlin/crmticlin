
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
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log(`[${requestId}] ❌ Método não permitido: ${req.method}`);
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    console.log(`[${requestId}] 📱 QR Webhook Payload:`, JSON.stringify(payload, null, 2));

    // Extrair dados padronizados
    const instanceId = payload.instanceId || payload.instance || payload.instanceName;
    const qrCode = payload.qrCode || payload.qr_code || payload.data?.qrCode;
    const event = payload.event || payload.type || 'qr_update';
    
    console.log(`[${requestId}] 📋 Dados extraídos:`, {
      instanceId,
      hasQrCode: !!qrCode,
      event
    });

    if (!instanceId) {
      console.error(`[${requestId}] ❌ Instance ID não encontrado no payload`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instance ID é obrigatório",
        requestId
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    // Buscar instância no banco (por vps_instance_id ou instance_name)
    let instanceQuery = supabase.from('whatsapp_instances').select('*');
    instanceQuery = instanceQuery.or(`vps_instance_id.eq.${instanceId},instance_name.eq.${instanceId}`);
    
    const { data: instance, error: fetchError } = await instanceQuery.single();

    if (fetchError || !instance) {
      console.error(`[${requestId}] ❌ Instância não encontrada:`, fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Instância não encontrada",
        instanceId,
        requestId
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      });
    }

    console.log(`[${requestId}] ✅ Instância encontrada: ${instance.id} (${instance.instance_name})`);

    // Processar QR Code se presente
    if (qrCode && (event === 'qr_update' || event === 'qr.update' || event === 'qrcode.updated')) {
      console.log(`[${requestId}] 📱 Processando QR Code...`);
      
      // Normalizar QR Code
      let normalizedQR = qrCode;
      if (!qrCode.startsWith('data:image/')) {
        normalizedQR = `data:image/png;base64,${qrCode}`;
      }

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          qr_code: normalizedQR,
          web_status: 'waiting_scan',
          connection_status: 'waiting_qr',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error(`[${requestId}] ❌ Erro ao atualizar QR Code:`, updateError);
        throw updateError;
      }

      console.log(`[${requestId}] ✅ QR Code atualizado com sucesso`);
      
      return new Response(JSON.stringify({
        success: true,
        message: "QR Code atualizado com sucesso",
        instanceId: instance.id,
        requestId
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Processar atualização de conexão
    if (event === 'connection.update' || event === 'status_update') {
      console.log(`[${requestId}] 🔗 Processando atualização de conexão...`);
      
      const status = payload.status || payload.connection_status || payload.data?.status;
      const phone = payload.phone || payload.number || payload.data?.phone;
      const profileName = payload.profileName || payload.profile_name || payload.data?.profileName;

      console.log(`[${requestId}] 📊 Status recebido:`, { status, phone, profileName });

      const statusMapping: Record<string, string> = {
        'open': 'connected',
        'ready': 'connected', 
        'connected': 'connected',
        'connecting': 'connecting',
        'disconnected': 'disconnected',
        'close': 'disconnected',
        'error': 'error'
      };

      const connectionStatus = statusMapping[status] || 'disconnected';

      const updateData: any = {
        connection_status: connectionStatus,
        web_status: status,
        updated_at: new Date().toISOString()
      };

      if (connectionStatus === 'connected') {
        updateData.date_connected = new Date().toISOString();
        updateData.qr_code = null;
        if (phone) updateData.phone = phone;
        if (profileName) updateData.profile_name = profileName;
      }

      if (connectionStatus === 'disconnected') {
        updateData.date_disconnected = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instance.id);

      if (updateError) {
        console.error(`[${requestId}] ❌ Erro ao atualizar status:`, updateError);
        throw updateError;
      }

      console.log(`[${requestId}] ✅ Status atualizado: ${connectionStatus}`);

      return new Response(JSON.stringify({
        success: true,
        message: "Status de conexão atualizado",
        status: connectionStatus,
        instanceId: instance.id,
        requestId
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[${requestId}] ℹ️ Evento não processado:`, event);
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Evento recebido mas não processado",
      event,
      requestId
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(`[${requestId}] ❌ Erro geral:`, error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Erro interno do servidor",
      requestId
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});
