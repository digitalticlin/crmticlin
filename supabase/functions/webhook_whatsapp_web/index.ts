
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
    console.log('WhatsApp Web webhook received:', JSON.stringify(payload, null, 2));

    const { event, instanceId, data } = payload;

    switch (event) {
      case 'qr':
        await handleQREvent(supabase, instanceId, data);
        break;
      
      case 'ready':
        await handleReadyEvent(supabase, instanceId, data);
        break;
      
      case 'message':
        await handleMessageEvent(supabase, instanceId, data);
        break;
      
      case 'disconnected':
        await handleDisconnectedEvent(supabase, instanceId);
        break;
      
      default:
        console.log(`Unknown webhook event: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
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

async function handleQREvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling QR event for instance:', instanceId);
  
  await supabase
    .from('whatsapp_instances')
    .update({
      qr_code: data.qr,
      web_status: 'waiting_scan',
      connection_status: 'connecting'
    })
    .eq('vps_instance_id', instanceId);
}

async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling ready event for instance:', instanceId);
  
  await supabase
    .from('whatsapp_instances')
    .update({
      web_status: 'ready',
      connection_status: 'open',
      phone: data.phone || '',
      profile_name: data.name || '',
      profile_pic_url: data.profilePic || '',
      date_connected: new Date().toISOString(),
      qr_code: null,
      session_data: data
    })
    .eq('vps_instance_id', instanceId);
}

async function handleMessageEvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling message event for instance:', instanceId);
  
  // Get WhatsApp instance
  const { data: whatsappInstance } = await supabase
    .from('whatsapp_instances')
    .select('id, company_id')
    .eq('vps_instance_id', instanceId)
    .single();

  if (!whatsappInstance) {
    console.error('WhatsApp instance not found for VPS instance:', instanceId);
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
        unread_count: existingLead.unread_count + 1
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
      timestamp: new Date(data.timestamp * 1000).toISOString()
    });
}

async function handleDisconnectedEvent(supabase: any, instanceId: string) {
  console.log('Handling disconnected event for instance:', instanceId);
  
  await supabase
    .from('whatsapp_instances')
    .update({
      web_status: 'disconnected',
      connection_status: 'disconnected',
      date_disconnected: new Date().toISOString()
    })
    .eq('vps_instance_id', instanceId);
}
