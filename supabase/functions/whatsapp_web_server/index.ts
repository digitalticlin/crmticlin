
import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from './config.ts';

import { createInstance } from './instanceCreationService.ts';
import { getQRCodeAsync } from './qrCodeAsyncService.ts';
import { deleteInstance } from './instanceDeletionService.ts';
import { checkServerHealth, getServerInfo } from './serverHealthService.ts';
import { syncInstances } from './instanceSyncService.ts';
import { sendMessage } from './messageSendingService.ts';
import { getChatHistory } from './chatHistoryService.ts';
import { importChatHistory } from './chatHistoryService.ts';
import { configureWebhookForInstance, removeWebhookForInstance } from './webhookConfigurationService.ts';
import { syncStatusAndWebhooks } from './statusSyncService.ts';
import { syncOrphanInstances } from './orphanSyncService.ts';

Deno.serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - FASE 2.0 BACKEND COMPLETO');
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
        const createResult = await createInstance(supabase, body.instanceData);
        return new Response(JSON.stringify(createResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: createResult.success ? 200 : 500
        });

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 📱 GET QR CODE ASYNC');
        const qrCodeResult = await getQRCodeAsync(supabase, body.instanceData);
        return new Response(JSON.stringify(qrCodeResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: qrCodeResult.success ? 200 : (qrCodeResult.waiting ? 202 : 500)
        });

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        const deleteResult = await deleteInstance(supabase, body.instanceData);
        return new Response(JSON.stringify(deleteResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: deleteResult.success ? 200 : 500
        });

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

      case 'sync_all_instances':
        console.log('[WhatsApp Server] 🔄 SYNC ALL INSTANCES');
        const syncResult = await syncInstances(supabase);
        return new Response(JSON.stringify(syncResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: syncResult.success ? 200 : 500
        });

      case 'sync_status_webhooks':
        console.log('[WhatsApp Server] ⚙️ SYNC STATUS WEBHOOKS');
        const statusSyncResult = await syncStatusAndWebhooks(supabase);
        return new Response(JSON.stringify(statusSyncResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: statusSyncResult.success ? 200 : 500
        });

      case 'sync_orphan_instances':
        console.log('[WhatsApp Server] 👥 SYNC ORPHAN INSTANCES');
        const orphanSyncResult = await syncOrphanInstances(supabase);
        return new Response(JSON.stringify(orphanSyncResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: orphanSyncResult.success ? 200 : 500
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
      
      case 'import_chat_history':
        console.log('[WhatsApp Server] 📚 IMPORT CHAT HISTORY');
        const importResult = await importChatHistory(supabase, body.instanceData);
        return new Response(JSON.stringify(importResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: importResult.success ? 200 : 500
        });

      case 'configure_webhook':
        console.log('[WhatsApp Server] 🔧 CONFIGURE WEBHOOK');
        const configResult = await configureWebhookForInstance(body.instanceData.instanceId);
        return configResult;

      case 'remove_webhook':
        console.log('[WhatsApp Server] 🗑️ REMOVE WEBHOOK');
        const removeResult = await removeWebhookForInstance(body.instanceData.instanceId);
        return removeResult;

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
