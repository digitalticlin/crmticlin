
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCORSPreflight, createResponse } from './utils/corsUtils.ts';
import { handleQREvent } from './handlers/qrHandler.ts';
import { handleReadyEvent } from './handlers/readyHandler.ts';
import { handleMessageEvent } from './handlers/messageHandler.ts';
import { handleDisconnectedEvent } from './handlers/disconnectedHandler.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCORSPreflight();
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
      return createResponse({ success: false, error: 'Invalid payload' }, 400);
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

    return createResponse({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return createResponse({ 
      success: false, 
      error: error.message 
    }, 500);
  }
});
