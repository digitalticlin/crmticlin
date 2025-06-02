
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './config.ts';
import { RequestBody } from './types.ts';
import { authenticateRequest } from './authentication.ts';
import { createWhatsAppInstance, deleteWhatsAppInstance } from './instanceManagement.ts';
import { getInstanceStatus, getQRCode, checkServerHealth, getServerInfo, syncInstances } from './statusOperations.ts';
import { sendMessage } from './messageOperations.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[WhatsApp Web Server] ${req.method} request received`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const user = await authenticateRequest(req, supabase);
    const { action, instanceData }: RequestBody = await req.json();

    console.log(`[WhatsApp Web Server] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'create_instance':
        console.log(`[WhatsApp Web Server] Creating instance: ${instanceData.instanceName}`);
        return await createWhatsAppInstance(supabase, instanceData, user.id);
      
      case 'delete_instance':
        console.log(`[WhatsApp Web Server] Deleting instance: ${instanceData.instanceId}`);
        return await deleteWhatsAppInstance(supabase, instanceData.instanceId!);
      
      case 'get_status':
        console.log(`[WhatsApp Web Server] Getting status for instance: ${instanceData.instanceId}`);
        return await getInstanceStatus(instanceData.instanceId!);
      
      case 'get_qr_code':
        console.log(`[WhatsApp Web Server] Getting QR code for instance: ${instanceData.instanceId}`);
        return await getQRCode(instanceData.instanceId!);
      
      case 'check_server':
        console.log(`[WhatsApp Web Server] Checking server health`);
        return await checkServerHealth();

      case 'get_server_info':
        console.log(`[WhatsApp Web Server] Getting server info`);
        return await getServerInfo();

      case 'sync_instances':
        console.log(`[WhatsApp Web Server] Syncing instances`);
        // Get user company for syncing
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.company_id) {
          throw new Error('User company not found');
        }
        
        return await syncInstances(supabase, profile.company_id);

      case 'send_message':
        console.log(`[WhatsApp Web Server] Sending message via instance: ${instanceData.instanceId}`);
        return await sendMessage(instanceData.instanceId!, instanceData.phone!, instanceData.message!);
        
      default:
        console.error(`[WhatsApp Web Server] Unknown action: ${action}`);
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[WhatsApp Web Server] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
