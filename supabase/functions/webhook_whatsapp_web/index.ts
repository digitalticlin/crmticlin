
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { WebhookData } from './types.ts';
import { findInstance } from './instanceService.ts';
import { processIncomingMessage } from './messageProcessor.ts';
import { processConnectionUpdate } from './connectionProcessor.ts';
import { processQRUpdate } from './qrProcessor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('[Webhook WhatsApp Web] 📨 WEBHOOK RECEIVED - CORREÇÃO QR AUTO-SAVE');
  
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

    const { instanceName, data: messageData, event } = webhookData;
    
    if (!instanceName) {
      console.error('[Webhook WhatsApp Web] ❌ instanceName not provided');
      return new Response(
        JSON.stringify({ success: false, error: 'instanceName not provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find instance
    const instance = await findInstance(supabase, instanceName);
    if (!instance) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Instance not found', 
          instanceName
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CORREÇÃO: Processar QR.UPDATE com auto-save no banco
    if (event === 'qr.update') {
      console.log('[Webhook WhatsApp Web] 📱 Processando QR.UPDATE com auto-save');
      const result = await processQRUpdate(supabase, instance, messageData);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process different event types
    if (event === 'messages.upsert' && messageData.messages) {
      const result = await processIncomingMessage(supabase, instance, messageData);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (event === 'connection.update') {
      const result = await processConnectionUpdate(supabase, instance, messageData);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Webhook WhatsApp Web] ℹ️ Event not processed:', event);
    return new Response(
      JSON.stringify({ success: true, processed: false, event }),
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
