
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from './config.ts';
import { authenticateUser } from './authService.ts';
import { createWhatsAppInstance } from './instanceCreationService.ts';
import { deleteWhatsAppInstance } from './instanceDeletionService.ts';
import { getQRCodeAsync } from './qrCodeAsyncService.ts';

console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - VERSÃO CORRIGIDA ATIVA');

Deno.serve(async (req) => {
  console.log('[WhatsApp Server] Method:', req.method);
  console.log('[WhatsApp Server] URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[WhatsApp Server] ✅ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[WhatsApp Server] 📊 Supabase client created');

    // Parse request body
    const requestText = await req.text();
    console.log('[WhatsApp Server] 📥 Raw request body:', requestText);
    
    const body = requestText ? JSON.parse(requestText) : {};
    console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(body, null, 2));

    // Extract action from body
    const action = body.action;
    console.log('[WhatsApp Server] 🎯 Action extracted:', action);

    // Authenticate user
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: authResult.error }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { user } = authResult;
    console.log('[WhatsApp Server] 🔐 Usuário autenticado:', user.id, user.email);

    // Process different actions
    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🆕 CREATE INSTANCE');
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        return await deleteWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 🔳 GET QR CODE ASYNC');
        return await getQRCodeAsync(supabase, body.instanceData, user.id);

      default:
        console.error('[WhatsApp Server] ❌ Ação não reconhecida:', action);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Ação não reconhecida: ${action}` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error: any) {
    console.error('[WhatsApp Server] ❌ ERRO GERAL:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
