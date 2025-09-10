
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCampaignRequest {
  action: 'create_campaign';
  name: string;
  message_text: string;
  media_type?: string;
  media_url?: string;
  target_type: 'all' | 'funnel' | 'stage' | 'tags' | 'custom';
  target_config?: any;
  schedule_type?: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: string;
  rate_limit_per_minute?: number;
}

interface StartCampaignRequest {
  action: 'start_campaign';
  campaign_id: string;
}

interface GetCampaignsRequest {
  action: 'get_campaigns';
  status?: string;
}

serve(async (req) => {
  console.log('🚀 [Broadcast Campaign Manager] Request received:', req.method);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await req.json();
    const { action } = requestBody;

    console.log(`📋 [Campaign Manager] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create_campaign': {
        const request = requestBody as CreateCampaignRequest;
        
        // Validate required fields
        if (!request.name || !request.message_text) {
          return new Response(JSON.stringify({ 
            error: 'Name and message_text are required' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create campaign
        const { data: campaign, error: campaignError } = await supabase
          .from('broadcast_campaigns')
          .insert({
            created_by_user_id: user.id,
            name: request.name,
            message_text: request.message_text,
            media_type: request.media_type || 'text',
            media_url: request.media_url,
            target_type: request.target_type,
            target_config: request.target_config || {},
            schedule_type: request.schedule_type || 'immediate',
            scheduled_at: request.scheduled_at ? new Date(request.scheduled_at) : null,
            rate_limit_per_minute: request.rate_limit_per_minute || 2,
            status: 'draft'
          })
          .select()
          .single();

        if (campaignError) {
          console.error('❌ [Campaign Manager] Error creating campaign:', campaignError);
          return new Response(JSON.stringify({ error: campaignError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('✅ [Campaign Manager] Campaign created:', campaign.id);

        return new Response(JSON.stringify({
          success: true,
          campaign,
          message: 'Campaign created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'start_campaign': {
        const request = requestBody as StartCampaignRequest;
        
        if (!request.campaign_id) {
          return new Response(JSON.stringify({ 
            error: 'Campaign ID is required' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verify campaign ownership
        const { data: campaign, error: campaignError } = await supabase
          .from('broadcast_campaigns')
          .select('*')
          .eq('id', request.campaign_id)
          .eq('created_by_user_id', user.id)
          .single();

        if (campaignError || !campaign) {
          return new Response(JSON.stringify({ 
            error: 'Campaign not found or access denied' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (campaign.status !== 'draft' && campaign.status !== 'paused') {
          return new Response(JSON.stringify({ 
            error: 'Campaign cannot be started from current status' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Call database function to create queue
        const { data: recipientCount, error: queueError } = await supabase
          .rpc('create_broadcast_queue', {
            p_campaign_id: request.campaign_id,
            p_user_id: user.id
          });

        if (queueError) {
          console.error('❌ [Campaign Manager] Error creating queue:', queueError);
          return new Response(JSON.stringify({ error: queueError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Add to PGMQ scheduler queue for processing
        const { error: pgmqError } = await supabase
          .rpc('pgmq_send', {
            queue_name: 'broadcast_scheduler_queue',
            msg: {
              campaign_id: request.campaign_id,
              user_id: user.id,
              action: 'process_campaign',
              created_at: new Date().toISOString()
            }
          });

        if (pgmqError) {
          console.error('❌ [Campaign Manager] Error adding to PGMQ:', pgmqError);
          // Don't fail the request, campaign is created and can be processed manually
        }

        console.log(`✅ [Campaign Manager] Campaign started with ${recipientCount} recipients`);

        return new Response(JSON.stringify({
          success: true,
          campaign_id: request.campaign_id,
          recipients_count: recipientCount,
          message: 'Campaign started successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_campaigns': {
        const request = requestBody as GetCampaignsRequest;
        
        let query = supabase
          .from('broadcast_campaigns')
          .select(`
            *,
            total_recipients,
            sent_count,
            failed_count
          `)
          .eq('created_by_user_id', user.id)
          .order('created_at', { ascending: false });

        if (request.status) {
          query = query.eq('status', request.status);
        }

        const { data: campaigns, error: campaignsError } = await query;

        if (campaignsError) {
          console.error('❌ [Campaign Manager] Error fetching campaigns:', campaignsError);
          return new Response(JSON.stringify({ error: campaignsError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          campaigns,
          count: campaigns?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ [Campaign Manager] Critical error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
