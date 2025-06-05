import { serve } from 'https://deno.land/std@0.177.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from './config.ts';
import { authenticateUser } from './authentication.ts';
import { createWhatsAppInstance } from './instanceCreationService.ts';
import { getQRCodeAsync } from './qrCodeAsyncService.ts';
import { deleteWhatsAppInstance } from './instanceDeletionService.ts';
import { 
  listAllInstancesGlobal, 
  syncOrphanInstances, 
  cleanupOrphanInstances, 
  massReconnectInstances,
  bindInstanceToUser as bindInstanceGlobal
} from './globalInstanceService.ts';
import { 
  bindInstanceToUser, 
  bindOrphanInstanceById 
} from './instanceUserBinding.ts';
import { syncAllInstances } from './instanceSyncDedicatedService.ts';
import { deleteVPSInstanceCleanup } from './vpsCleanupService.ts';

Deno.serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - VERSÃO CORRIGIDA ATIVA');
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
    console.log('[WhatsApp Server] 📊 Supabase client created');

    const rawBody = await req.text();
    console.log('[WhatsApp Server] 📥 Raw request body:', rawBody);

    const body = JSON.parse(rawBody);
    console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(body, null, 2));

    const action = body.action;
    console.log('[WhatsApp Server] 🎯 Action extracted:', action);

    // Ação especial para cleanup de VPS - não requer autenticação (chamada por trigger)
    if (action === 'delete_vps_instance_cleanup') {
      console.log('[WhatsApp Server] 🧹 VPS CLEANUP (triggered by database)');
      return await deleteVPSInstanceCleanup(supabase, body.vps_instance_id, body.instance_name);
    }

    // Authenticate user for most actions
    const authResult = await authenticateUser(req, supabase);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;
    console.log('[WhatsApp Server] 🔐 Usuário autenticado:', user.id, user.email);

    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    // Handle different actions
    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🆕 CREATE INSTANCE');
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'get_qr_code_async':
        console.log('[WhatsApp Server] 🔳 GET QR CODE ASYNC');
        return await getQRCodeAsync(supabase, body.instanceData.instanceId, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        return await deleteWhatsAppInstance(supabase, body.instanceData.instanceId);

      case 'sync_all_instances':
        console.log('[WhatsApp Server] 🔄 SYNC ALL INSTANCES (DEDICATED)');
        return await syncAllInstances(supabase);

      case 'check_server_health':
        console.log('[WhatsApp Server] 🏥 CHECK SERVER HEALTH');
        return await checkServerHealth();

      case 'get_server_info':
        console.log('[WhatsApp Server] 📊 GET SERVER INFO');
        return await getServerInfo();

      case 'list_all_instances_global':
        console.log('[WhatsApp Server] 🌐 LIST ALL INSTANCES GLOBAL');
        return await listAllInstancesGlobal(supabase);

      case 'sync_orphan_instances':
        console.log('[WhatsApp Server] 🔄 SYNC ORPHAN INSTANCES');
        return await syncOrphanInstances(supabase);

      case 'cleanup_orphan_instances':
        console.log('[WhatsApp Server] 🧹 CLEANUP ORPHAN INSTANCES');
        return await cleanupOrphanInstances(supabase);

      case 'mass_reconnect_instances':
        console.log('[WhatsApp Server] 🔄 MASS RECONNECT INSTANCES');
        return await massReconnectInstances(supabase);

      case 'configure_webhook':
        console.log('[WhatsApp Server] 🔗 CONFIGURE WEBHOOK');
        const { instanceId, webhookUrl } = body.instanceData;
        
        // Fazer requisição para VPS configurar webhook
        const vpsResponse = await fetch(`http://31.97.24.222:3001/instance/${instanceId}/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer default-token'
          },
          body: JSON.stringify({
            webhookUrl: webhookUrl,
            events: ['messages.upsert', 'qr.update', 'connection.update']
          })
        });

        if (vpsResponse.ok) {
          console.log('[WhatsApp Server] ✅ Webhook configurado com sucesso');
          return new Response(
            JSON.stringify({ success: true, message: 'Webhook configurado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const errorText = await vpsResponse.text();
          console.error('[WhatsApp Server] ❌ Erro ao configurar webhook:', errorText);
          return new Response(
            JSON.stringify({ success: false, error: errorText }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'bind_instance_to_user':
        console.log('[WhatsApp Server] 🔗 BIND INSTANCE TO USER');
        
        console.log('[WhatsApp Server] Request body details:', {
          hasInstanceData: !!body.instanceData,
          instanceData: body.instanceData,
          phoneFilter: body.phoneFilter,
          userEmail: body.userEmail
        });

        if (body.instanceData && body.instanceData.instanceId && body.instanceData.userEmail) {
          console.log('[WhatsApp Server] 🔗 BIND ORPHAN BY VPS INSTANCE ID');
          console.log('[WhatsApp Server] Parameters:', {
            instanceId: body.instanceData.instanceId,
            userEmail: body.instanceData.userEmail
          });
          return await bindOrphanInstanceById(supabase, body.instanceData.instanceId, body.instanceData.userEmail);
        } else if (body.phoneFilter && body.userEmail) {
          console.log('[WhatsApp Server] 🔗 BIND BY PHONE FILTER');
          return await bindInstanceToUser(supabase, body.phoneFilter, body.userEmail);
        } else {
          console.log('[WhatsApp Server] 🔗 BIND BY GLOBAL SERVICE');
          return await bindInstanceGlobal(supabase, body);
        }

      default:
        console.log('[WhatsApp Server] ❌ Unknown action:', action);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ação não reconhecida',
            action: action
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error: any) {
    console.error('[WhatsApp Server] 💥 ERRO GERAL:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
