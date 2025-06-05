
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "./config.ts";
import { createWhatsAppInstance, deleteWhatsAppInstance } from "./instanceManagement.ts";
import { getQRCodeFromVPS } from "./qrCodeService.ts";
import { getQRCodeAsync } from "./qrCodeAsyncService.ts";

// CORREÇÃO: Auth helper melhorado
async function authenticateUser(request: Request, supabase: any) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('[Auth] Validating token...', { tokenLength: token.length, tokenPreview: token.substring(0, 20) + '...' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('[Auth] Authentication failed:', error);
    throw new Error('Invalid authentication token');
  }

  console.log('[Auth] User authenticated successfully:', {
    userId: user.id,
    email: user.email
  });

  return user;
}

serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - CORREÇÃO PERMANENTE ATIVA');
  console.log('[WhatsApp Server] Method:', req.method);
  console.log('[WhatsApp Server] URL:', req.url);
  console.log('[WhatsApp Server] Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[WhatsApp Server] ✅ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[WhatsApp Server] 📊 Supabase client created');

    // Parse request body
    const requestBody = await req.text();
    console.log('[WhatsApp Server] 📥 Raw request body:', requestBody);
    
    const body = JSON.parse(requestBody);
    console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(body, null, 2));

    const action = body.action;
    console.log('[WhatsApp Server] 🎯 Action extracted:', action);

    // Authenticate user
    const user = await authenticateUser(req, supabase);
    console.log('[WhatsApp Server] 🔐 Usuário autenticado:', user.id, user.email);

    // Process action with enhanced error handling
    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🚀 CREATE INSTANCE - CORREÇÃO PERMANENTE ativada');
        console.log('[WhatsApp Server] Instance data:', JSON.stringify(body.instanceData, null, 2));
        console.log('[WhatsApp Server] User ID:', user.id);
        
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        return await deleteWhatsAppInstance(supabase, body.instanceData.instanceId);

      case 'get_qr_code':
        console.log('[WhatsApp Server] 📱 GET QR CODE (legacy)');
        const qrResult = await getQRCodeFromVPS(body.instanceData.instanceId);
        
        if (qrResult.success) {
          return new Response(
            JSON.stringify(qrResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(qrResult.error || 'Failed to get QR code');
        }

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 📱 GET QR CODE ASYNC - CORREÇÃO PERMANENTE');
        return await getQRCodeAsync(supabase, body.instanceData.instanceId, user.id);

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('[WhatsApp Server] 💥 ERRO GERAL (CORREÇÃO PERMANENTE):', error);
    console.error('[WhatsApp Server] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'error_handling_improved'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
