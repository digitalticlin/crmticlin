
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from './config.ts';
import { authenticateUser } from './authentication.ts';
import { createWhatsAppInstance } from './instanceCreationService.ts';
import { deleteWhatsAppInstance } from './instanceDeletionService.ts';
import { getQRCodeAsync } from './qrCodeAsyncService.ts';
import { sendMessage } from './messageSendingService.ts';
import { getChatHistory } from './chatHistoryService.ts';
import { syncAllInstances } from './instanceSyncService.ts';
import { getHealthStatus } from './healthService.ts';

console.log('[WhatsApp Server] 🚀 DIAGNÓSTICO COMPLETO - Edge Function inicializada');

Deno.serve(async (req) => {
  const requestId = `req_${Date.now()}`;
  console.log(`[WhatsApp Server] 📨 DIAGNÓSTICO COMPLETO - Nova requisição [${requestId}]`);
  console.log(`[WhatsApp Server] Method: ${req.method}`);
  console.log(`[WhatsApp Server] URL: ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[WhatsApp Server] ✅ OPTIONS request handled [${requestId}]`);
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) {
    console.log(`[WhatsApp Server] 🏥 Health check endpoint [${requestId}]`);
    return await getHealthStatus();
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[WhatsApp Server] 📊 Supabase client created [${requestId}]`);

    // Parse request body
    const requestText = await req.text();
    console.log(`[WhatsApp Server] 📥 Raw request body [${requestId}]:`, requestText);
    
    const body = requestText ? JSON.parse(requestText) : {};
    console.log(`[WhatsApp Server] 📋 Parsed request body [${requestId}]:`, JSON.stringify(body, null, 2));

    // Extract action from body
    const action = body.action;
    console.log(`[WhatsApp Server] 🎯 Action extracted [${requestId}]: ${action}`);

    // Authenticate user
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      console.error(`[WhatsApp Server] ❌ Falha na autenticação [${requestId}]:`, authResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.error,
          requestId 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { user } = authResult;
    console.log(`[WhatsApp Server] 🔐 Usuário autenticado [${requestId}]:`, user.id, user.email);

    // Process different actions
    console.log(`[WhatsApp Server] 🎯 Processing action [${requestId}]: ${action}`);

    switch (action) {
      case 'create_instance':
        console.log(`[WhatsApp Server] 🆕 CREATE INSTANCE [${requestId}]`);
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'delete_instance':
        console.log(`[WhatsApp Server] 🗑️ DELETE INSTANCE [${requestId}]`);
        return await deleteWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'get_qr_code_async':
        console.log(`[WhatsApp Server] 🔳 GET QR CODE ASYNC [${requestId}]`);
        return await getQRCodeAsync(supabase, body.instanceData, user.id);

      case 'send_message':
        console.log(`[WhatsApp Server] 📤 SEND MESSAGE [${requestId}]`);
        return await sendMessage(supabase, body.messageData, user.id);

      case 'get_chat_history':
        console.log(`[WhatsApp Server] 📚 GET CHAT HISTORY [${requestId}]`);
        return await getChatHistory(supabase, body.chatData, user.id);

      case 'sync_all_instances':
        console.log(`[WhatsApp Server] 🔄 SYNC ALL INSTANCES [${requestId}]`);
        return await syncAllInstances(supabase, body.syncData, user.id);

      default:
        console.error(`[WhatsApp Server] ❌ Ação não reconhecida [${requestId}]: ${action}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Ação não reconhecida: ${action}`,
            requestId,
            availableActions: [
              'create_instance',
              'delete_instance', 
              'get_qr_code_async',
              'send_message',
              'get_chat_history',
              'sync_all_instances'
            ]
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ ERRO GERAL [${requestId}]:`, {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        requestId,
        timestamp: new Date().toISOString(),
        debug: {
          url: req.url,
          method: req.method,
          errorType: error.constructor.name
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
