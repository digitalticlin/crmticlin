
import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.70.0';
import { corsHeaders } from './config.ts';
import { createWhatsAppInstance } from './instanceCreationService.ts';

console.log(`[WhatsApp Server] 🚀 CORREÇÃO TOTAL - Servidor iniciado`);

serve(async (req) => {
  console.log(`[WhatsApp Server] 🚀 REQUEST RECEIVED`);
  console.log(`[WhatsApp Server] Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[WhatsApp Server] ✅ OPTIONS request handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const rawBody = await req.text();
    console.log(`[WhatsApp Server] 📥 Raw request body: ${rawBody}`);

    let requestBody: any = {};
    if (rawBody) {
      try {
        requestBody = JSON.parse(rawBody);
        console.log(`[WhatsApp Server] 📋 Parsed request body:`, JSON.stringify(requestBody, null, 2));
      } catch (e) {
        console.error(`[WhatsApp Server] ❌ Invalid JSON:`, e);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const { action } = requestBody;
    console.log(`[WhatsApp Server] 🎯 Action: ${action}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[WhatsApp Server] ❌ Missing Authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error(`[WhatsApp Server] ❌ Invalid token:`, authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[WhatsApp Server] 👤 User authenticated: ${user.email}`);

    // Handle different actions
    switch (action) {
      case 'create_instance':
        console.log(`[WhatsApp Server] ✨ CREATE INSTANCE`);
        return await createWhatsAppInstance(supabase, requestBody.instanceData, user.id);

      default:
        console.log(`[WhatsApp Server] ❓ Unknown action: ${action}`);
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error: any) {
    console.error(`[WhatsApp Server] ❌ Unhandled error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
