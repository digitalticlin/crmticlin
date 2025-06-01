
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

    if (!event || !instanceId) {
      console.error('Invalid webhook payload - missing event or instanceId');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing webhook event: ${event} for instance: ${instanceId}`);

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
  console.log('QR data:', data);
  
  try {
    const { data: updateResult, error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: data.qr,
        web_status: 'waiting_scan',
        connection_status: 'connecting'
      })
      .eq('vps_instance_id', instanceId)
      .select();

    if (error) {
      console.error('Error updating QR code:', error);
      throw error;
    }

    console.log('QR code updated successfully:', updateResult);
  } catch (error) {
    console.error('Failed to handle QR event:', error);
    throw error;
  }
}

async function handleReadyEvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling ready event for instance:', instanceId);
  console.log('Ready data:', JSON.stringify(data, null, 2));
  
  try {
    // First, check if instance exists
    const { data: existingInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .single();

    if (checkError) {
      console.error('Error checking existing instance:', checkError);
      throw new Error(`Instance not found: ${instanceId}`);
    }

    console.log('Existing instance found:', existingInstance);

    // Extract phone number and clean it
    const phone = data.phone || data.phoneNumber || data.id || '';
    const profileName = data.name || data.profileName || data.pushname || '';
    const profilePicUrl = data.profilePic || data.profilePicUrl || '';

    console.log('Extracted data:', { phone, profileName, profilePicUrl });

    const { data: updateResult, error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'ready',
        connection_status: 'open',
        phone: phone,
        profile_name: profileName,
        profile_pic_url: profilePicUrl,
        date_connected: new Date().toISOString(),
        qr_code: null,
        session_data: data
      })
      .eq('vps_instance_id', instanceId)
      .select();

    if (error) {
      console.error('Error updating ready status:', error);
      throw error;
    }

    console.log('Instance updated successfully on ready:', updateResult);
  } catch (error) {
    console.error('Failed to handle ready event:', error);
    throw error;
  }
}

async function handleMessageEvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling message event for instance:', instanceId);
  
  try {
    // Get WhatsApp instance
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('vps_instance_id', instanceId)
      .single();

    if (instanceError || !whatsappInstance) {
      console.error('WhatsApp instance not found for VPS instance:', instanceId, instanceError);
      return;
    }

    // Extract phone number and clean it
    const phoneNumber = (data.from || '').replace(/\D/g, '');
    
    if (!phoneNumber) {
      console.error('No phone number found in message data');
      return;
    }

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

    console.log('Message processed successfully');
  } catch (error) {
    console.error('Failed to handle message event:', error);
  }
}

async function handleDisconnectedEvent(supabase: any, instanceId: string) {
  console.log('Handling disconnected event for instance:', instanceId);
  
  try {
    const { data: updateResult, error } = await supabase
      .from('whatsapp_instances')
      .update({
        web_status: 'disconnected',
        connection_status: 'disconnected',
        date_disconnected: new Date().toISOString()
      })
      .eq('vps_instance_id', instanceId)
      .select();

    if (error) {
      console.error('Error updating disconnected status:', error);
      throw error;
    }

    console.log('Instance disconnected successfully:', updateResult);
  } catch (error) {
    console.error('Failed to handle disconnected event:', error);
    throw error;
  }
}
