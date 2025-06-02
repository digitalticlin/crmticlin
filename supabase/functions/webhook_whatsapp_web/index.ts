import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('[Webhook] 📥 WhatsApp Web webhook received:', JSON.stringify(payload, null, 2));

    const { event, instanceId, data } = payload;

    switch (event) {
      case 'instance_created':
        await handleInstanceCreatedEvent(supabase, instanceId, data);
        break;
      
      case 'instance_destroyed':
        await handleInstanceDestroyedEvent(supabase, instanceId, data);
        break;
      
      case 'qr':
        await handleQREvent(supabase, instanceId, data);
        break;
      
      case 'authenticated':
        await handleAuthenticatedEvent(supabase, instanceId, data);
        break;
      
      case 'ready':
        await handleReadyEvent(supabase, instanceId, data);
        break;
      
      case 'message':
        await handleMessageEvent(supabase, instanceId, data);
        break;
      
      case 'disconnected':
        await handleDisconnectedEvent(supabase, instanceId, data);
        break;
      
      case 'auth_failure':
        await handleAuthFailureEvent(supabase, instanceId, data);
        break;
      
      default:
        console.log(`[Webhook] ❓ Unknown webhook event: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook] ❌ Webhook error:', error);
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
});

async function handleInstanceCreatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🆕 Handling instance creation event for:', instanceId);
  
  try {
    // Verificar se a instância já existe no banco
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Webhook] ❌ Error checking existing instance:', checkError);
      return;
    }

    if (existingInstance) {
      console.log('[Webhook] ℹ️ Instance already exists in database:', instanceId);
      
      // Atualizar status para 'connecting' se necessário
      if (existingInstance.connection_status !== 'connecting') {
        await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: 'connecting',
            web_status: 'initializing',
            updated_at: new Date().toISOString()
          })
          .eq('vps_instance_id', instanceId);
        
        console.log('[Webhook] ✅ Updated existing instance status to connecting');
      }
    } else {
      console.log('[Webhook] 🔍 Instance not found in database, will be handled by sync process');
      // A instância será detectada e adotada pelo processo de sync
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleInstanceCreatedEvent:', error);
  }
}

async function handleInstanceDestroyedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🗑️ Handling instance destruction event for:', instanceId);
  
  try {
    // Marcar a instância como desconectada ao invés de excluir
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        connection_status: 'disconnected',
        web_status: 'destroyed',
        date_disconnected: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating destroyed instance:', error);
    } else {
      console.log('[Webhook] ✅ Instance marked as destroyed successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleInstanceDestroyedEvent:', error);
  }
}

async function handleQREvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 📱 Handling QR event for instance:', instanceId);
  
  try {
    // Primeiro verificar se a instância existe
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (!existingInstance) {
      console.log('[Webhook] ⚠️ Instance not found for QR event, will be handled by sync');
      return;
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: data.qr,
        web_status: 'waiting_scan',
        connection_status: 'connecting',
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating QR code:', error);
    } else {
      console.log('[Webhook] ✅ QR code updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleQREvent:', error);
  }
}

async function handleAuthenticatedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🔐 Handling authenticated event for instance:', instanceId);
  
  try {
    // Verificar se a instância existe
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (!existingInstance) {
      console.log('[Webhook] ⚠️ Instance not found for authenticated event, will be handled by sync');
      return;
    }

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'authenticated',
        connection_status: 'authenticated',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating authenticated status:', error);
    } else {
      console.log('[Webhook] ✅ Authenticated status updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleAuthenticatedEvent:', error);
  }
}

async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🚀 Handling ready event for instance:', instanceId, 'with data:', data);
  
  try {
    // LOGGING DETALHADO PARA DEBUGGING
    console.log('[Webhook] 📊 Instance data received:', {
      instanceId,
      phone: data.phone,
      name: data.name,
      profilePic: data.profilePic
    });

    // Verificar se a instância existe no banco
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Webhook] ❌ Error checking instance:', checkError);
      return;
    }

    if (!existingInstance) {
      console.log('[Webhook] ⚠️ Instance not found in database for ready event, will be handled by sync process');
      return;
    }

    // ATUALIZAÇÃO CRÍTICA COM INFORMAÇÕES COMPLETAS
    const updateData: any = {
      web_status: 'ready',
      connection_status: 'open',
      date_connected: new Date().toISOString(),
      qr_code: null,
      updated_at: new Date().toISOString()
    };

    // Adicionar dados do telefone se disponíveis
    if (data.phone) {
      updateData.phone = data.phone;
      console.log('[Webhook] 📱 Phone number to update:', data.phone);
    }

    if (data.name) {
      updateData.profile_name = data.name;
      console.log('[Webhook] 👤 Profile name to update:', data.name);
    }

    if (data.profilePic) {
      updateData.profile_pic_url = data.profilePic;
      console.log('[Webhook] 🖼️ Profile pic to update:', data.profilePic);
    }

    console.log('[Webhook] 💾 Updating database with data:', updateData);

    const { data: updatedInstance, error } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('vps_instance_id', instanceId)
      .select()
      .single();

    if (error) {
      console.error('[Webhook] ❌ Error updating ready status:', error);
    } else {
      console.log('[Webhook] ✅ ✅ ✅ Instance ready and CONNECTED successfully!');
      console.log('[Webhook] 📊 Updated instance data:', updatedInstance);
      console.log('[Webhook] 🎉 INSTÂNCIA CONECTADA COM SUCESSO:', {
        id: updatedInstance?.id,
        instance_name: updatedInstance?.instance_name,
        phone: updatedInstance?.phone,
        status: updatedInstance?.connection_status
      });
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleReadyEvent:', error);
  }
}

async function handleMessageEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 💬 Handling message event for instance:', instanceId);
  
  try {
    // Get WhatsApp instance
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('[Webhook] ❌ WhatsApp instance not found for VPS instance:', instanceId, instanceError);
      return;
    }

    // Extract phone number and clean it
    const phoneNumber = data.from.replace(/\D/g, '');
    
    // Find or create lead
    let lead;
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('whatsapp_number_id', whatsappInstance.id)
      .single();

    if (existingLead) {
      lead = existingLead;
      
      // Update lead with new message info
      await supabase
        .from('leads')
        .update({
          last_message: data.body || '[Mídia]',
          last_message_time: new Date().toISOString(),
          unread_count: existingLead.unread_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);
    } else {
      // Create new lead
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          phone: phoneNumber,
          name: data.notifyName || data.from,
          whatsapp_number_id: whatsappInstance.id,
          company_id: whatsappInstance.company_id,
          last_message: data.body || '[Mídia]',
          last_message_time: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();
      
      lead = newLead;
    }

    if (lead) {
      // Save message
      await supabase
        .from('messages')
        .insert({
          lead_id: lead.id,
          whatsapp_number_id: whatsappInstance.id,
          text: data.body || '',
          from_me: false,
          external_id: data.id,
          media_type: data.type || 'text',
          media_url: data.mediaUrl || null,
          timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : new Date().toISOString()
        });

      console.log('[Webhook] ✅ Message processed successfully for lead:', lead.id);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleMessageEvent:', error);
  }
}

async function handleDisconnectedEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🔌 Handling disconnected event for instance:', instanceId);
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'disconnected',
        connection_status: 'disconnected',
        date_disconnected: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating disconnected status:', error);
    } else {
      console.log('[Webhook] ✅ Disconnected status updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleDisconnectedEvent:', error);
  }
}

async function handleAuthFailureEvent(supabase: any, instanceId: string, data: any) {
  console.log('[Webhook] 🚨 Handling auth failure event for instance:', instanceId);
  
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'auth_failure',
        connection_status: 'auth_failure',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId);

    if (error) {
      console.error('[Webhook] ❌ Error updating auth failure status:', error);
    } else {
      console.log('[Webhook] ✅ Auth failure status updated successfully for:', instanceId);
    }
  } catch (error) {
    console.error('[Webhook] ❌ Exception in handleAuthFailureEvent:', error);
  }
}
