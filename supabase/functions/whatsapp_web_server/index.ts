
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

console.log('[WhatsApp Server] 🚀 CORREÇÃO ROBUSTA - Edge Function inicializada com todas as funções');

Deno.serve(async (req) => {
  console.log('[WhatsApp Server] 📨 CORREÇÃO ROBUSTA - Nova requisição recebida');
  console.log('[WhatsApp Server] Method:', req.method);
  console.log('[WhatsApp Server] URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[WhatsApp Server] ✅ CORREÇÃO ROBUSTA - OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  // CORREÇÃO ROBUSTA: Adicionar endpoint /health para validação
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) {
    console.log('[WhatsApp Server] 🏥 CORREÇÃO ROBUSTA - Health check endpoint');
    return await getHealthStatus();
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[WhatsApp Server] 📊 CORREÇÃO ROBUSTA - Supabase client created');

    // Parse request body
    const requestText = await req.text();
    console.log('[WhatsApp Server] 📥 CORREÇÃO ROBUSTA - Raw request body:', requestText);
    
    const body = requestText ? JSON.parse(requestText) : {};
    console.log('[WhatsApp Server] 📋 CORREÇÃO ROBUSTA - Parsed request body:', JSON.stringify(body, null, 2));

    // Extract action from body
    const action = body.action;
    console.log('[WhatsApp Server] 🎯 CORREÇÃO ROBUSTA - Action extracted:', action);

    // Authenticate user
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      console.error('[WhatsApp Server] ❌ CORREÇÃO ROBUSTA - Falha na autenticação:', authResult.error);
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { user } = authResult;
    console.log('[WhatsApp Server] 🔐 CORREÇÃO ROBUSTA - Usuário autenticado:', user.id, user.email);

    // Process different actions
    console.log('[WhatsApp Server] 🎯 CORREÇÃO ROBUSTA - Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🆕 CORREÇÃO ROBUSTA - CREATE INSTANCE');
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ CORREÇÃO ROBUSTA - DELETE INSTANCE');
        return await deleteWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 🔳 CORREÇÃO ROBUSTA - GET QR CODE ASYNC');
        return await getQRCodeAsync(supabase, body.instanceData, user.id);

      case 'send_message':
        console.log('[WhatsApp Server] 📤 CORREÇÃO ROBUSTA - SEND MESSAGE');
        return await sendMessage(supabase, body.messageData, user.id);

      case 'get_chat_history':
        console.log('[WhatsApp Server] 📚 CORREÇÃO ROBUSTA - GET CHAT HISTORY');
        return await getChatHistory(supabase, body.chatData, user.id);

      case 'sync_all_instances':
        console.log('[WhatsApp Server] 🔄 CORREÇÃO ROBUSTA - SYNC ALL INSTANCES');
        return await syncAllInstances(supabase, body.syncData, user.id);

      default:
        console.error('[WhatsApp Server] ❌ CORREÇÃO ROBUSTA - Ação não reconhecida:', action);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Ação não reconhecida: ${action}`,
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
    console.error('[WhatsApp Server] ❌ CORREÇÃO ROBUSTA - ERRO GERAL:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
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
