
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("WEBHOOK_SECRET")!;

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${expectedSignature}` === signature;
}

// Input sanitization
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input.replace(/[<>\"']/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return input;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid signature' 
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const webhookData = JSON.parse(body);
    const sanitizedData = sanitizeInput(webhookData);
    
    console.log('[Webhook Security] Verified and sanitized webhook data:', {
      event: sanitizedData.event,
      instanceId: sanitizedData.instanceId,
      timestamp: new Date().toISOString()
    });

    // Process different webhook events
    let result;
    switch (sanitizedData.event) {
      case 'qr_update':
        result = await processQRUpdate(supabase, sanitizedData);
        break;
      case 'message_received':
        result = await processMessage(supabase, sanitizedData);
        break;
      case 'connection_update':
        result = await processConnectionUpdate(supabase, sanitizedData);
        break;
      default:
        console.warn('Unknown webhook event:', sanitizedData.event);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Unknown event type' 
        }), {
          status: 400,
          headers: corsHeaders
        });
    }

    // Log successful webhook processing
    await supabase.from('sync_logs').insert({
      function_name: 'webhook_whatsapp_web',
      status: 'success',
      result: {
        event: sanitizedData.event,
        instanceId: sanitizedData.instanceId,
        processed: true,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Log error for monitoring
    await supabase.from('sync_logs').insert({
      function_name: 'webhook_whatsapp_web',
      status: 'error',
      error_message: error.message,
      result: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Webhook processing failed' 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

async function processQRUpdate(supabase: any, data: any) {
  const { instanceId, qrCode } = data;
  
  if (!instanceId || !qrCode) {
    return { success: false, error: 'Missing required data' };
  }

  // Update QR code in database
  const { error } = await supabase
    .from('whatsapp_instances')
    .update({
      qr_code: qrCode,
      web_status: 'waiting_scan',
      connection_status: 'waiting_scan',
      updated_at: new Date().toISOString()
    })
    .eq('vps_instance_id', instanceId);

  if (error) {
    console.error('QR update error:', error);
    return { success: false, error: 'Failed to update QR code' };
  }

  return { success: true, message: 'QR code updated' };
}

async function processMessage(supabase: any, data: any) {
  const { instanceId, from, message, fromMe } = data;
  
  if (!instanceId || !from || !message) {
    return { success: false, error: 'Missing required message data' };
  }

  // Use secure message processing function
  const { data: result, error } = await supabase.rpc('save_whatsapp_message_service_role', {
    p_vps_instance_id: instanceId,
    p_phone: from,
    p_message_text: message.text || '',
    p_from_me: fromMe || false,
    p_media_type: message.type || 'text',
    p_media_url: message.mediaUrl || null,
    p_external_message_id: message.id || null,
    p_contact_name: data.contactName || null
  });

  if (error || !result?.success) {
    console.error('Message processing error:', error || result);
    return { success: false, error: 'Failed to process message' };
  }

  return { success: true, message: 'Message processed' };
}

async function processConnectionUpdate(supabase: any, data: any) {
  const { instanceId, status, phone, profileName } = data;
  
  if (!instanceId || !status) {
    return { success: false, error: 'Missing connection data' };
  }

  // Update connection status
  const { error } = await supabase
    .from('whatsapp_instances')
    .update({
      connection_status: status,
      web_status: status,
      phone: phone || null,
      profile_name: profileName || null,
      date_connected: status === 'connected' ? new Date().toISOString() : null,
      date_disconnected: status === 'disconnected' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('vps_instance_id', instanceId);

  if (error) {
    console.error('Connection update error:', error);
    return { success: false, error: 'Failed to update connection' };
  }

  return { success: true, message: 'Connection updated' };
}
