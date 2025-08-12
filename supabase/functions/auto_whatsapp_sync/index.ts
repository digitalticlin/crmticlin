import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
console.log('[Auto WhatsApp Sync] 🤖 WEBHOOK PARA SINCRONIZAÇÃO EXATA - SEM ALTERAR NÚMEROS');
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
    console.log('[Auto WhatsApp Sync] 📥 Dados recebidos:', JSON.stringify(requestBody, null, 2));
    const { instanceId, status, event, timestamp, phone, profile_name, profile_pic_url, senderProfileName, senderProfilePicBase64, instanceProfilePicBase64 } = requestBody;
    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }
    console.log(`[Auto WhatsApp Sync] 🔄 Processando instância EXATA: ${instanceId} - Status: ${status} - Evento: ${event}`);
    // 🎯 CORREÇÃO PRINCIPAL: Buscar APENAS por vps_instance_id EXATO
    const { data: existingInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`[Auto WhatsApp Sync] ❌ Erro ao buscar instância ${instanceId}:`, fetchError);
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
          console.error('[Auto WhatsApp Sync] ❌ Erro ao atualizar lead:', leadErr);
        } else {
          console.log(`[Auto WhatsApp Sync] ✅ Lead atualizado: ${phone}`);
        }
      }

      return new Response(JSON.stringify({ success: true, updated: true, event: 'lead_profile_updated' }), { headers: corsHeaders });
    }

    if (existingInstance) {
      console.log(`[Auto WhatsApp Sync] 🎯 Instância encontrada: ${existingInstance.instance_name} (Phone atual: ${existingInstance.phone})`);

      // 🔒 PROTEÇÃO: Só atualizar dados seguros, PRESERVAR O PHONE EXISTENTE
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // ✅ Atualizar status apenas se válido e diferente
      if (status && status !== 'unknown' && status !== existingInstance.connection_status) {
        updateData.connection_status = status;
        updateData.web_status = status;
        console.log(`[Auto WhatsApp Sync] 📊 Status atualizado: ${existingInstance.connection_status} → ${status}`);
      }
      // 🔒 NUNCA ALTERAR O PHONE SE JÁ EXISTE
      if (existingInstance.phone) {
        console.log(`[Auto WhatsApp Sync] 🔒 Phone preservado: ${existingInstance.phone}`);
        // NÃO fazer updateData.phone = phone
      } else if (phone) {
        // Só definir phone se não existir
        updateData.phone = phone;
        console.log(`[Auto WhatsApp Sync] 📱 Phone definido pela primeira vez: ${phone}`);
      }

      // ✅ Outros dados seguros podem ser atualizados
      if (profile_name && profile_name !== existingInstance.profile_name) {
        updateData.profile_name = profile_name;
        console.log(`[Auto WhatsApp Sync] 👤 Profile name atualizado: ${profile_name}`);
      }
      
      if ((profile_pic_url || instanceProfilePicBase64) && 
          (profile_pic_url !== existingInstance.profile_pic_url)) {
        updateData.profile_pic_url = profile_pic_url || instanceProfilePicBase64;
        console.log(`[Auto WhatsApp Sync] 🖼️ Profile pic atualizado`);
      }
      // ✅ Datas de conexão/desconexão
      if (status === 'connected' || status === 'open') {
        if (!existingInstance.date_connected) {
          updateData.date_connected = new Date().toISOString();
        }
        updateData.date_disconnected = null;
      }
      
      if (status === 'close' || status === 'disconnected') {
        updateData.date_disconnected = new Date().toISOString();
      }
      // Só fazer update se houver mudanças reais
      if (Object.keys(updateData).length > 1) { // mais que só updated_at
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('id', existingInstance.id);

        if (updateError) {
          console.error(`[Auto WhatsApp Sync] ❌ Erro ao atualizar:`, updateError);
          throw new Error(`Erro ao atualizar instância: ${updateError.message}`);
        }

        console.log(`[Auto WhatsApp Sync] ✅ Instância sincronizada: ${instanceId}`);
      } else {
        console.log(`[Auto WhatsApp Sync] ℹ️ Nenhuma alteração necessária: ${instanceId}`);
      }
      return new Response(JSON.stringify({
        success: true,
        message: 'Instância sincronizada corretamente',
        instanceId,
        status,
        event,
        updated: true,
        preservedPhone: existingInstance.phone
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log(`[Auto WhatsApp Sync] ⚠️ Instância VPS não encontrada no banco: ${instanceId}`);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Instância VPS não encontrada no banco - pode ser órfã ou nova',
        instanceId,
        status,
        event,
        updated: false,
        action: 'ignored'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('[Auto WhatsApp Sync] ❌ Erro crítico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
