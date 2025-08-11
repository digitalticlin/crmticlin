import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
console.log('[Auto WhatsApp Sync] 🤖 WEBHOOK PARA ATUALIZAÇÃO INDIVIDUAL DE INSTÂNCIA');
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Parse request body para dados da instância específica
    const requestBody = await req.json();
    console.log('[Auto WhatsApp Sync] 📥 Dados recebidos:', requestBody);
    const { instanceId, status, event, timestamp, phone, profile_name, profile_pic_url, senderProfileName, senderProfilePicBase64, instanceProfilePicBase64 } = requestBody;
    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }
    console.log(`[Auto WhatsApp Sync] 🔄 Processando instância: ${instanceId} - Status: ${status} - Evento: ${event}`);
    // Buscar instância existente
    const { data: existingInstance, error: fetchError } = await supabase.from('whatsapp_instances').select('*').eq('vps_instance_id', instanceId).or(`instance_name.eq.${instanceId}`).single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar instância: ${fetchError.message}`);
    }
    // Caso especial: atualização de perfil de lead (evento dedicado e leve)
    if (event === 'lead_profile_updated') {
      if (!phone) {
        return new Response(JSON.stringify({ success: false, error: 'phone é obrigatório' }), { headers: corsHeaders, status: 400 });
      }

      const updateLead: any = {};
      if (senderProfileName) updateLead.name = senderProfileName;
      if (senderProfilePicBase64 || profile_pic_url) {
        updateLead.profile_pic_url = senderProfilePicBase64 || profile_pic_url;
      }

      if (Object.keys(updateLead).length > 0) {
        const { error: leadErr } = await supabase
          .from('leads')
          .update(updateLead)
          .eq('phone', phone);
        if (leadErr) {
          throw new Error(`Erro ao atualizar lead: ${leadErr.message}`);
        }
      }

      return new Response(JSON.stringify({ success: true, updated: true, event: 'lead_profile_updated' }), { headers: corsHeaders });
    }

    if (existingInstance) {
      // Atualizar instância existente
      const updateData = {
        connection_status: status || 'unknown',
        web_status: status || 'unknown',
        updated_at: new Date().toISOString()
      };
      // Adicionar dados do WhatsApp se disponíveis
      if (phone) updateData.phone = phone;
      if (profile_name) updateData.profile_name = profile_name;
      if (profile_pic_url || instanceProfilePicBase64) updateData.profile_pic_url = profile_pic_url || instanceProfilePicBase64;
      // Se conectou, marcar data de conexão
      if (status === 'connected' || status === 'open') {
        updateData.date_connected = new Date().toISOString();
        updateData.date_disconnected = null;
      }
      // Se desconectou, marcar data de desconexão
      if (status === 'close' || status === 'disconnected') {
        updateData.date_disconnected = new Date().toISOString();
      }
      const { error: updateError } = await supabase.from('whatsapp_instances').update(updateData).eq('id', existingInstance.id);
      if (updateError) {
        throw new Error(`Erro ao atualizar instância: ${updateError.message}`);
      }
      console.log(`[Auto WhatsApp Sync] ✅ Instância atualizada: ${instanceId}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Instância atualizada com sucesso',
        instanceId,
        status,
        event,
        updated: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Instância não encontrada - pode ser órfã, apenas logar
      console.log(`[Auto WhatsApp Sync] ⚠️ Instância não encontrada no banco: ${instanceId}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Instância não encontrada no banco (pode ser órfã)',
        instanceId,
        status,
        event,
        updated: false
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('[Auto WhatsApp Sync] ❌ Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
