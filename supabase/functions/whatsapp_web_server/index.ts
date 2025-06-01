
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './config.ts';
import { RequestBody } from './types.ts';
import { authenticateRequest } from './authentication.ts';
import { createWhatsAppInstance, deleteWhatsAppInstance } from './instanceManagement.ts';
import { getInstanceStatus, getQRCode, checkServerHealth, syncInstanceStatus, forceSync } from './statusOperations.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const user = await authenticateRequest(req, supabase);
    const { action, instanceData }: RequestBody = await req.json();

    console.log(`[WhatsApp Web Server] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create_instance':
        return await createWhatsAppInstance(supabase, instanceData, user.id);
      
      case 'delete_instance':
        return await deleteWhatsAppInstance(supabase, instanceData.instanceId!);
      
      case 'get_status':
        return await getInstanceStatus(instanceData.instanceId!);
      
      case 'get_qr':
        return await getQRCode(instanceData.instanceId!);

      case 'sync_status':
        return await syncInstanceStatus(supabase, instanceData.vpsInstanceId!);

      case 'force_sync':
        return await forceSync(supabase, instanceData.vpsInstanceId!);
      
      case 'check_server':
        return await checkServerHealth();
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[WhatsApp Web Server] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
