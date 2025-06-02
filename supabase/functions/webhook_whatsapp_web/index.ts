
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  handleInstanceCreatedEvent, 
  handleInstanceDestroyedEvent, 
  handleDisconnectedEvent, 
  handleAuthFailureEvent 
} from './eventHandlers.ts';
import { 
  handleQREvent, 
  handleAuthenticatedEvent, 
  handleReadyEvent 
} from './connectionHandlers.ts';
import { handleMessageEvent } from './messageHandler.ts';

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
