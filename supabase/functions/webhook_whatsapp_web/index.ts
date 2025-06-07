import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { WebhookData } from './types.ts';
import { handleWebhookV2 } from './webhookHandlerV2.ts';
import { findInstance } from './instanceService.ts';
import { processIncomingMessage } from './messageProcessor.ts';
import { processConnectionUpdate } from './connectionProcessor.ts';
import { processQRUpdate } from './qrProcessor.ts';
import { processQRUpdateV2 } from './qrProcessorV2.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('[Webhook WhatsApp Web] 📨 WEBHOOK RECEIVED - V3 COM PROCESSO CORRETO');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData: WebhookData = await req.json();
    console.log('[Webhook WhatsApp Web] Data received:', JSON.stringify(webhookData, null, 2));

    // NOVO: Usar handler V2 que implementa processo correto
    console.log('[Webhook WhatsApp Web] 🎯 Usando handler V2 com processo correto');
    const result = await handleWebhookV2(supabase, webhookData);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook WhatsApp Web] ❌ General error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
