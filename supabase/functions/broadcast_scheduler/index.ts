
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('⏰ [Broadcast Scheduler] Request received:', req.method);

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
    const { job = 'process_queue' } = requestBody;

    console.log(`📋 [Scheduler] Processing job: ${job}`);

    let processedCount = 0;
    let errorCount = 0;

    // Process pending messages in queue with rate limiting
    const { data: queueItems, error: queueError } = await supabase
      .from('broadcast_queue')
      .select(`
        *,
        campaign:broadcast_campaigns(
          created_by_user_id,
          rate_limit_per_minute,
          business_hours_only,
          timezone,
          status
        )
      `)
      .in('status', ['queued', 'retry'])
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(50); // Process max 50 items per execution

    if (queueError) {
      console.error('❌ [Scheduler] Error fetching queue:', queueError);
      return new Response(JSON.stringify({ error: queueError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('ℹ️ [Scheduler] No items to process');
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No items to process'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 [Scheduler] Found ${queueItems.length} items to process`);

    // Group by user for rate limiting
    const userGroups = new Map<string, any[]>();
    for (const item of queueItems) {
      const userId = item.campaign?.created_by_user_id;
      if (!userId) continue;
      
      if (!userGroups.has(userId)) {
        userGroups.set(userId, []);
      }
      userGroups.get(userId)!.push(item);
    }

    // Process each user's messages with rate limiting
    for (const [userId, userItems] of userGroups) {
      try {
        // Check user's rate limit
        const { data: canSend } = await supabase
          .rpc('check_rate_limit', { p_user_id: userId });

        if (!canSend) {
          console.log(`⏳ [Scheduler] Rate limit reached for user ${userId}`);
          continue;
        }

        // Process one message for this user
        const item = userItems[0];
        
        // Skip if campaign is not active
        if (item.campaign?.status !== 'running') {
          console.log(`⏭️ [Scheduler] Skipping inactive campaign for item ${item.id}`);
          continue;
        }

        // Check business hours if required
        if (item.campaign?.business_hours_only) {
          const now = new Date();
          const hour = now.getHours();
          
          // Business hours: 8 AM to 6 PM
          if (hour < 8 || hour >= 18) {
            console.log(`🏢 [Scheduler] Outside business hours for item ${item.id}`);
            // Reschedule for next business day at 8 AM
            const nextBusinessDay = new Date(now);
            nextBusinessDay.setDate(now.getDate() + 1);
            nextBusinessDay.setHours(8, 0, 0, 0);
            
            await supabase
              .from('broadcast_queue')
              .update({ scheduled_for: nextBusinessDay.toISOString() })
              .eq('id', item.id);
              
            continue;
          }
        }

        console.log(`📤 [Scheduler] Processing message for ${item.phone}`);

        // Mark as processing
        const { error: updateError } = await supabase
          .from('broadcast_queue')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`❌ [Scheduler] Error updating status for ${item.id}:`, updateError);
          errorCount++;
          continue;
        }

        // Send to sender queue via PGMQ
        const { error: pgmqError } = await supabase
          .rpc('pgmq_send', {
            queue_name: 'broadcast_sender_queue',
            msg: {
              queue_item_id: item.id,
              campaign_id: item.campaign_id,
              whatsapp_instance_id: item.whatsapp_instance_id,
              phone: item.phone,
              contact_name: item.contact_name,
              message_text: item.message_text,
              media_type: item.media_type,
              media_url: item.media_url,
              user_id: userId,
              created_at: new Date().toISOString()
            }
          });

        if (pgmqError) {
          console.error(`❌ [Scheduler] Error adding to sender queue:`, pgmqError);
          
          // Mark as failed
          await supabase
            .from('broadcast_queue')
            .update({ 
              status: 'failed',
              last_error: pgmqError.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
            
          errorCount++;
          continue;
        }

        // Increment rate limit for user
        await supabase.rpc('increment_rate_limit', { p_user_id: userId });

        processedCount++;
        
        console.log(`✅ [Scheduler] Item ${item.id} sent to sender queue`);
        
      } catch (error) {
        console.error(`❌ [Scheduler] Error processing user ${userId}:`, error);
        errorCount++;
      }
    }

    // Update campaign statistics
    const campaignIds = [...new Set(queueItems.map(item => item.campaign_id))];
    for (const campaignId of campaignIds) {
      try {
        // Get current counts
        const { data: counts } = await supabase
          .from('broadcast_queue')
          .select('status')
          .eq('campaign_id', campaignId);

        if (counts) {
          const sent = counts.filter(c => c.status === 'sent').length;
          const failed = counts.filter(c => c.status === 'failed').length;
          const total = counts.length;
          const pending = counts.filter(c => ['queued', 'retry', 'processing'].includes(c.status)).length;

          let status = 'running';
          if (pending === 0) {
            status = failed === total ? 'failed' : 'completed';
          }

          await supabase
            .from('broadcast_campaigns')
            .update({
              sent_count: sent,
              failed_count: failed,
              status: status,
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId);
        }
      } catch (error) {
        console.error(`❌ [Scheduler] Error updating campaign ${campaignId}:`, error);
      }
    }

    console.log(`✅ [Scheduler] Completed: ${processedCount} processed, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      errors: errorCount,
      total_items: queueItems.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Scheduler] Critical error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
