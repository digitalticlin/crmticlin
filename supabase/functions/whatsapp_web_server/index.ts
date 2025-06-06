
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from './config.ts';

import { createWhatsAppInstance } from './instanceCreationService.ts';
import { getQRCodeAsync } from './qrCodeAsyncService.ts';
import { deleteWhatsAppInstance } from './instanceDeletionService.ts';
import { checkServerHealth, getServerInfo } from './serverHealthService.ts';
import { sendMessage } from './messageSendingService.ts';
import { getChatHistory } from './chatHistoryGetService.ts';
import { configureWebhookForInstance, removeWebhookForInstance } from './webhookConfigurationService.ts';
import { saveQRCodeToDatabase } from './saveQRCodeService.ts';

Deno.serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - CORREÇÃO DEFINITIVA EDGE FUNCTION');
  console.log('[WhatsApp Server] Method:', req.method);
  console.log('[WhatsApp Server] URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[WhatsApp Server] ✅ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.text();
    console.log('[WhatsApp Server] 📥 Raw request body:', requestBody);

    const body = JSON.parse(requestBody);
    console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(body, null, 2));

    const action = body.action;
    console.log('[WhatsApp Server] 🎯 Action extracted:', action);

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[WhatsApp Server] ❌ No Authorization header provided');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('[WhatsApp Server] 🔑 Token extracted:', token.substring(0, 10) + '...');

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      console.error('[WhatsApp Server] ❌ Invalid token:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[WhatsApp Server] 👤 User authenticated:', user.email);

    // Process different actions
    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] ✨ CREATE INSTANCE');
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 📱 GET QR CODE ASYNC');
        return await getQRCodeAsync(supabase, body.instanceData, user.id);

      case 'save_qr_code':
        console.log('[WhatsApp Server] 💾 SAVE QR CODE');
        return await saveQRCodeToDatabase(supabase, body.qrData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        return await deleteWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'check_server_health':
        console.log('[WhatsApp Server] 🩺 CHECK SERVER HEALTH');
        const healthResult = await checkServerHealth(supabase);
        return new Response(JSON.stringify(healthResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: healthResult.success ? 200 : 500
        });

      case 'get_server_info':
        console.log('[WhatsApp Server] ℹ️ GET SERVER INFO');
        const infoResult = await getServerInfo(supabase);
        return new Response(JSON.stringify(infoResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: infoResult.success ? 200 : 500
        });

      case 'send_message':
        console.log('[WhatsApp Server] 📤 SEND MESSAGE');
        const sendResult = await sendMessage(supabase, body.messageData);
        return new Response(JSON.stringify(sendResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: sendResult.success ? 200 : 500
        });

      case 'get_chat_history':
        console.log('[WhatsApp Server] 📚 GET CHAT HISTORY');
        const historyResult = await getChatHistory(supabase, body.chatData);
        return new Response(JSON.stringify(historyResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: historyResult.success ? 200 : 500
        });

      case 'configure_webhook':
        console.log('[WhatsApp Server] 🔧 CONFIGURE WEBHOOK');
        return await configureWebhookForInstance(body.instanceData.instanceId);

      case 'remove_webhook':
        console.log('[WhatsApp Server] 🗑️ REMOVE WEBHOOK');
        return await removeWebhookForInstance(body.instanceData.instanceId);

      default:
        console.warn('[WhatsApp Server] ⚠️ UNKNOWN ACTION');
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[WhatsApp Server] 🔥 ERROR:', error);
    return new Response(JSON.stringify({ error: error.message, details: error }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
