
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "./config.ts";
import { createWhatsAppInstance, deleteWhatsAppInstance } from "./instanceManagement.ts";
import { getQRCodeFromVPS } from "./qrCodeService.ts";
import { getQRCodeAsync } from "./qrCodeAsyncService.ts";
import { checkServerHealth, getServerInfo } from "./serverHealthService.ts";
import { makeVPSRequest } from "./vpsRequestService.ts";
import { VPS_CONFIG, getVPSHeaders } from "./config.ts";
import { 
  listAllInstancesGlobal, 
  syncOrphanInstances, 
  cleanupOrphanInstances, 
  massReconnectInstances,
  bindInstanceToUser
} from "./globalInstanceService.ts";

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

// NOVO: Função para enviar mensagens via VPS
async function sendMessageViaVPS(instanceId: string, phone: string, message: string) {
  console.log('[Send Message] 📤 Sending message via VPS:', { instanceId, phone, messageLength: message.length });
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/send`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({
        instanceId,
        phone,
        message
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Send Message] ✅ Message sent successfully:', data);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data,
          message: 'Message sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('[Send Message] ❌ VPS send failed:', errorText);
      throw new Error(`VPS send failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('[Send Message] 💥 Error sending message:', error);
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
}

// NOVO: Função para obter status de instância específica
async function getInstanceStatus(instanceId: string) {
  console.log('[Instance Status] 📊 Getting status for instance:', instanceId);
  
  try {
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: getVPSHeaders(),
      body: JSON.stringify({ instanceId })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Instance Status] ✅ Status retrieved:', data);
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('[Instance Status] ❌ VPS status failed:', errorText);
      throw new Error(`VPS status failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('[Instance Status] 💥 Error getting status:', error);
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
}

// NOVO: Função para sincronizar instâncias
async function syncInstancesWithVPS(supabase: any) {
  console.log('[Sync Instances] 🔄 Starting instances synchronization...');
  
  try {
    // Obter todas as instâncias da VPS
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!vpsResponse.ok) {
      throw new Error(`VPS instances request failed: ${vpsResponse.status}`);
    }

    const vpsData = await vpsResponse.json();
    const vpsInstances = vpsData.instances || [];
    
    console.log('[Sync Instances] 📋 VPS instances found:', vpsInstances.length);

    // Obter instâncias do Supabase
    const { data: supabaseInstances, error: supabaseError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (supabaseError) {
      throw new Error(`Supabase query failed: ${supabaseError.message}`);
    }

    console.log('[Sync Instances] 📋 Supabase instances found:', supabaseInstances?.length || 0);

    // Lógica de sincronização
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const vpsInstance of vpsInstances) {
      const existing = supabaseInstances?.find(si => si.vps_instance_id === vpsInstance.instanceId);
      
      if (existing) {
        // Atualizar instância existente
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            connection_status: vpsInstance.status || 'unknown',
            web_status: vpsInstance.state || 'unknown',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (!updateError) {
          updatedCount++;
        }
      } else {
        // Criar nova instância órfã para posterior adoção
        const { error: insertError } = await supabase
          .from('whatsapp_instances')
          .insert({
            vps_instance_id: vpsInstance.instanceId,
            instance_name: vpsInstance.sessionName || vpsInstance.instanceId,
            phone: 'Unknown',
            connection_type: 'web',
            connection_status: vpsInstance.status || 'unknown',
            web_status: vpsInstance.state || 'unknown',
            company_id: '00000000-0000-0000-0000-000000000000' // Placeholder para órfãs
          });

        if (!insertError) {
          createdCount++;
        }
      }
      
      syncedCount++;
    }

    console.log('[Sync Instances] ✅ Synchronization completed:', {
      syncedCount,
      createdCount,
      updatedCount
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          syncedCount,
          createdCount,
          updatedCount,
          vpsInstancesCount: vpsInstances.length,
          supabaseInstancesCount: supabaseInstances?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync Instances] 💥 Synchronization error:', error);
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
}

serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - CORREÇÃO CRÍTICA ATIVA');
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
    
    let body;
    try {
      body = JSON.parse(requestBody);
      console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[WhatsApp Server] ❌ JSON parse error:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const action = body.action;
    console.log('[WhatsApp Server] 🎯 Action extracted:', action);

    if (!action) {
      throw new Error('No action specified in request');
    }

    // Authenticate user
    const user = await authenticateUser(req, supabase);
    console.log('[WhatsApp Server] 🔐 Usuário autenticado:', user.id, user.email);

    // Process action with enhanced error handling
    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🚀 CREATE INSTANCE - CORREÇÃO CRÍTICA ativada');
        console.log('[WhatsApp Server] Instance data:', JSON.stringify(body.instanceData, null, 2));
        console.log('[WhatsApp Server] User ID:', user.id);
        
        if (!body.instanceData) {
          throw new Error('Instance data is required for create_instance action');
        }
        
        return await createWhatsAppInstance(supabase, body.instanceData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for delete_instance action');
        }
        
        return await deleteWhatsAppInstance(supabase, body.instanceData.instanceId);

      case 'get_qr_code':
        console.log('[WhatsApp Server] 📱 GET QR CODE (legacy)');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for get_qr_code action');
        }
        
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
        console.log('[WhatsApp Server] 📱 GET QR CODE ASYNC - CORREÇÃO CRÍTICA');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for get_qr_code_async action');
        }
        
        return await getQRCodeAsync(supabase, body.instanceData.instanceId, user.id);

      // CORREÇÃO CRÍTICA: Adicionar alias para refresh_qr_code
      case 'refresh_qr_code':
        console.log('[WhatsApp Server] 📱 REFRESH QR CODE (alias para get_qr_code_async)');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for refresh_qr_code action');
        }
        
        return await getQRCodeAsync(supabase, body.instanceData.instanceId, user.id);

      // NOVO: Action para verificar saúde do servidor VPS
      case 'check_server':
        console.log('[WhatsApp Server] 🏥 CHECK SERVER HEALTH');
        return await checkServerHealth();

      // NOVO: Action para obter informações do servidor
      case 'get_server_info':
        console.log('[WhatsApp Server] 📊 GET SERVER INFO');
        return await getServerInfo();

      // NOVO: Action para enviar mensagens
      case 'send_message':
        console.log('[WhatsApp Server] 📤 SEND MESSAGE');
        
        if (!body.instanceData?.instanceId || !body.instanceData?.phone || !body.instanceData?.message) {
          throw new Error('Instance ID, phone, and message are required for send_message action');
        }
        
        return await sendMessageViaVPS(
          body.instanceData.instanceId, 
          body.instanceData.phone, 
          body.instanceData.message
        );

      // NOVO: Action para obter status de instância
      case 'get_status':
        console.log('[WhatsApp Server] 📊 GET INSTANCE STATUS');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for get_status action');
        }
        
        return await getInstanceStatus(body.instanceData.instanceId);

      // NOVO: Action para sincronizar instâncias
      case 'sync_instances':
        console.log('[WhatsApp Server] 🔄 SYNC INSTANCES');
        return await syncInstancesWithVPS(supabase);

      // ACTIONS EXISTENTES PARA PAINEL DE ÓRFÃS
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
        console.log('[WhatsApp Server] 🔌 MASS RECONNECT INSTANCES');
        return await massReconnectInstances(supabase);

      case 'bind_instance_to_user':
        console.log('[WhatsApp Server] 🔗 BIND INSTANCE TO USER');
        
        if (!body.instanceData) {
          throw new Error('Instance data is required for bind_instance_to_user action');
        }
        
        return await bindInstanceToUser(supabase, body.instanceData);

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('[WhatsApp Server] 💥 ERRO GERAL (CORREÇÃO CRÍTICA):', error);
    console.error('[WhatsApp Server] Stack trace:', error.stack);
    
    // Determine appropriate HTTP status code
    let statusCode = 500;
    if (error.message.includes('Invalid JSON') || 
        error.message.includes('required') || 
        error.message.includes('No action specified')) {
      statusCode = 400; // Bad Request
    } else if (error.message.includes('authentication') || 
               error.message.includes('authorization')) {
      statusCode = 401; // Unauthorized
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        action: 'error_handling_improved',
        timestamp: new Date().toISOString(),
        details: {
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 5) // Primeiras 5 linhas do stack
        }
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
