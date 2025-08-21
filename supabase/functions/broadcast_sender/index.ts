
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('📨 [Broadcast Sender] Request received:', req.method);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const requestBody = await req.json().catch(() => ({}));
    
    // Can process individual messages or batch from PGMQ
    if (requestBody.queue_item_id) {
      // Process single message from PGMQ
      return await processSingleMessage(supabase, requestBody);
    } else {
      // Process messages from PGMQ queue
      return await processMessageQueue(supabase);
    }

  } catch (error) {
    console.error('❌ [Sender] Critical error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processSingleMessage(supabase: any, messageData: any) {
  const {
    queue_item_id,
    whatsapp_instance_id,
    phone,
    message_text,
    media_type = 'text',
    media_url,
    user_id
  } = messageData;

  console.log(`📤 [Sender] Processing message ${queue_item_id} to ${phone}`);

  try {
    // Get WhatsApp instance details
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id, connection_status')
      .eq('id', whatsapp_instance_id)
      .single();

    if (instanceError || !instance) {
      throw new Error(`WhatsApp instance not found: ${instanceError?.message}`);
    }

    if (instance.connection_status !== 'connected') {
      throw new Error(`WhatsApp instance not connected: ${instance.connection_status}`);
    }

    // Send message via WhatsApp messaging service
    const { data: sendResult, error: sendError } = await supabase.functions.invoke(
      'whatsapp_messaging_service',
      {
        body: {
          action: 'send_message',
          instanceId: whatsapp_instance_id,
          phone: phone,
          message: message_text,
          mediaType: media_type,
          mediaUrl: media_url
        }
      }
    );

    if (sendError || !sendResult?.success) {
      throw new Error(sendResult?.error || sendError?.message || 'Failed to send message');
    }

    console.log(`✅ [Sender] Message sent successfully: ${sendResult.messageId}`);

    // Update queue item as sent
    const { error: updateError } = await supabase
      .from('broadcast_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', queue_item_id);

    if (updateError) {
      console.error(`❌ [Sender] Error updating queue item:`, updateError);
    }

    // Add to history
    const { error: historyError } = await supabase
      .from('broadcast_history')
      .insert({
        campaign_id: messageData.campaign_id,
        queue_id: queue_item_id,
        lead_id: messageData.lead_id,
        phone: phone,
        status: 'sent',
        external_message_id: sendResult.messageId,
        sent_at: new Date().toISOString()
      });

    if (historyError) {
      console.error(`❌ [Sender] Error adding to history:`, historyError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: sendResult.messageId,
      queue_item_id: queue_item_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ [Sender] Error sending message ${queue_item_id}:`, error);

    // Get current retry count
    const { data: queueItem } = await supabase
      .from('broadcast_queue')
      .select('retry_count, max_retries')
      .eq('id', queue_item_id)
      .single();

    const retryCount = (queueItem?.retry_count || 0) + 1;
    const maxRetries = queueItem?.max_retries || 3;

    if (retryCount <= maxRetries) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(300000, 60000 * Math.pow(2, retryCount - 1)); // Max 5 minutes
      const retryTime = new Date(Date.now() + retryDelay);

      await supabase
        .from('broadcast_queue')
        .update({
          status: 'retry',
          retry_count: retryCount,
          last_error: error.message,
          scheduled_for: retryTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', queue_item_id);

      console.log(`🔄 [Sender] Scheduled retry ${retryCount}/${maxRetries} for ${queue_item_id}`);
    } else {
      // Mark as permanently failed
      await supabase
        .from('broadcast_queue')
        .update({
          status: 'failed',
          last_error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', queue_item_id);

      // Add to history as failed
      await supabase
        .from('broadcast_history')
        .insert({
          campaign_id: messageData.campaign_id,
          queue_id: queue_item_id,
          lead_id: messageData.lead_id,
          phone: phone,
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString()
        });

      console.log(`💀 [Sender] Permanently failed ${queue_item_id}: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      queue_item_id: queue_item_id,
      retry_count: retryCount
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function processMessageQueue(supabase: any) {
  console.log('📋 [Sender] Processing message queue from PGMQ');

  let processedCount = 0;
  let errorCount = 0;

  try {
    // Read messages from PGMQ queue
    const { data: messages, error: queueError } = await supabase
      .rpc('pgmq_read', {
        p_queue_name: 'broadcast_sender_queue',
        p_vt: 300, // 5 minute visibility timeout
        p_qty: 10  // Process up to 10 messages
      });

    if (queueError) {
      throw new Error(`PGMQ error: ${queueError.message}`);
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No messages in queue'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 [Sender] Processing ${messages.length} messages from queue`);

    // Process each message
    for (const msg of messages) {
      try {
        const messageData = msg.message;
        
        // Process the message
        const result = await processSingleMessage(supabase, messageData);
        const resultData = await result.json();
        
        if (resultData.success) {
          processedCount++;
          
          // Delete from PGMQ queue
          await supabase.rpc('pgmq_delete', {
            queue_name: 'broadcast_sender_queue',
            msg_id: msg.msg_id
          });
        } else {
          errorCount++;
          console.error(`❌ [Sender] Failed to process message ${msg.msg_id}:`, resultData.error);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ [Sender] Error processing message ${msg.msg_id}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total_messages: messages.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Sender] Error processing queue:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      processed: processedCount,
      errors: errorCount
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
