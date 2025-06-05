
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
import { bindInstanceToUser as bindByPhone, bindOrphanInstanceById } from "./instanceUserBinding.ts";
import { processIncomingWebhook } from "./webhookService.ts";
import { configureWebhookForInstance, removeWebhookForInstance } from "./webhookConfigurationService.ts";

// Auth helper melhorado
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

// Função para enviar mensagens via VPS
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

// Função para obter status de instância específica
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

// FUNÇÃO CORRIGIDA: Sincronizar TODAS as instâncias (melhorada com logs detalhados)
async function syncAllInstancesWithVPS(supabase: any) {
  const syncId = `sync_${Date.now()}`;
  console.log(`[Sync All Instances] 🔄 INICIANDO sincronização completa [${syncId}]`);
  
  try {
    // ETAPA 1: Buscar instâncias da VPS com logs detalhados
    console.log(`[${syncId}] 📡 Consultando VPS em: ${VPS_CONFIG.baseUrl}/instances`);
    console.log(`[${syncId}] 🔑 Headers da requisição:`, getVPSHeaders());
    
    const vpsResponse = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/instances`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (!vpsResponse.ok) {
      const errorText = await vpsResponse.text();
      console.error(`[${syncId}] ❌ Falha na requisição VPS:`, { status: vpsResponse.status, error: errorText });
      throw new Error(`VPS instances request failed: ${vpsResponse.status} - ${errorText}`);
    }

    const vpsData = await vpsResponse.json();
    const vpsInstances = vpsData.instances || [];
    
    console.log(`[${syncId}] ✅ VPS respondeu com sucesso:`);
    console.log(`[${syncId}] 📊 Total de instâncias na VPS: ${vpsInstances.length}`);
    console.log(`[${syncId}] 📋 Detalhes das instâncias VPS:`, vpsInstances.map(i => ({
      instanceId: i.instanceId,
      sessionName: i.sessionName,
      status: i.status,
      phone: i.phone,
      isReady: i.isReady
    })));

    // ETAPA 2: Buscar instâncias do Supabase
    console.log(`[${syncId}] 💾 Consultando instâncias do Supabase...`);
    const { data: supabaseInstances, error: supabaseError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    if (supabaseError) {
      console.error(`[${syncId}] ❌ Erro ao consultar Supabase:`, supabaseError);
      throw new Error(`Supabase query failed: ${supabaseError.message}`);
    }

    console.log(`[${syncId}] 💾 Supabase retornou ${supabaseInstances?.length || 0} instâncias`);
    if (supabaseInstances?.length > 0) {
      console.log(`[${syncId}] 📋 Instâncias existentes no Supabase:`, supabaseInstances.map(i => ({
        id: i.id,
        vps_instance_id: i.vps_instance_id,
        instance_name: i.instance_name,
        phone: i.phone,
        company_id: i.company_id
      })));
    }

    // ETAPA 3: Lógica de sincronização melhorada
    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const syncLog = [];

    console.log(`[${syncId}] 🔄 Iniciando processamento de ${vpsInstances.length} instâncias...`);

    for (const vpsInstance of vpsInstances) {
      try {
        console.log(`[${syncId}] 🔍 Processando instância: ${vpsInstance.instanceId}`);
        
        const existing = supabaseInstances?.find(si => si.vps_instance_id === vpsInstance.instanceId);
        
        if (existing) {
          // Atualizar instância existente
          console.log(`[${syncId}] 🔄 Atualizando instância existente: ${existing.id}`);
          
          const updateData = {
            connection_status: vpsInstance.status === 'ready' ? 'ready' : 
                             vpsInstance.status === 'waiting_scan' ? 'connecting' : 
                             'disconnected',
            web_status: vpsInstance.status || 'unknown',
            phone: vpsInstance.phone || existing.phone || 'Unknown',
            profile_name: vpsInstance.profileName || existing.profile_name,
            profile_pic_url: vpsInstance.profilePictureUrl || existing.profile_pic_url,
            updated_at: new Date().toISOString()
          };
          
          console.log(`[${syncId}] 📝 Dados de atualização:`, updateData);

          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`[${syncId}] ❌ Erro ao atualizar instância ${existing.id}:`, updateError);
            errorCount++;
            syncLog.push(`❌ Erro ao atualizar ${vpsInstance.instanceId}: ${updateError.message}`);
          } else {
            console.log(`[${syncId}] ✅ Instância atualizada com sucesso: ${existing.id}`);
            updatedCount++;
            syncLog.push(`✅ Atualizada: ${vpsInstance.instanceId} (${vpsInstance.sessionName})`);
          }
        } else {
          // Criar nova instância
          console.log(`[${syncId}] 🆕 Criando nova instância: ${vpsInstance.instanceId}`);
          
          const instanceData = {
            vps_instance_id: vpsInstance.instanceId,
            instance_name: vpsInstance.sessionName || vpsInstance.instanceId,
            phone: vpsInstance.phone || 'Unknown',
            profile_name: vpsInstance.profileName || null,
            profile_pic_url: vpsInstance.profilePictureUrl || null,
            connection_type: 'web',
            connection_status: vpsInstance.status === 'ready' ? 'ready' : 
                             vpsInstance.status === 'waiting_scan' ? 'connecting' : 
                             'disconnected',
            web_status: vpsInstance.status || 'unknown',
            server_url: VPS_CONFIG.baseUrl,
            date_connected: vpsInstance.status === 'ready' ? new Date().toISOString() : null,
            // Usar UUID placeholder para órfãs - serão vinculadas depois
            company_id: '00000000-0000-0000-0000-000000000000'
          };
          
          console.log(`[${syncId}] 📝 Dados de criação:`, instanceData);

          const { data: newInstance, error: insertError } = await supabase
            .from('whatsapp_instances')
            .insert(instanceData)
            .select()
            .single();

          if (insertError) {
            console.error(`[${syncId}] ❌ Erro ao criar instância ${vpsInstance.instanceId}:`, insertError);
            errorCount++;
            syncLog.push(`❌ Erro ao criar ${vpsInstance.instanceId}: ${insertError.message}`);
          } else {
            console.log(`[${syncId}] ✅ Nova instância criada com sucesso:`, newInstance.id);
            createdCount++;
            syncLog.push(`🆕 Criada: ${vpsInstance.instanceId} (${vpsInstance.sessionName})`);
          }
        }
        
        syncedCount++;
      } catch (instanceError) {
        console.error(`[${syncId}] 💥 Erro ao processar instância ${vpsInstance.instanceId}:`, instanceError);
        errorCount++;
        syncLog.push(`💥 Erro crítico em ${vpsInstance.instanceId}: ${instanceError.message}`);
      }
    }

    // ETAPA 4: Relatório final detalhado
    console.log(`[${syncId}] 🏁 SINCRONIZAÇÃO CONCLUÍDA:`);
    console.log(`[${syncId}] 📊 Estatísticas finais:`);
    console.log(`[${syncId}]   - Total processadas: ${syncedCount}`);
    console.log(`[${syncId}]   - Novas criadas: ${createdCount}`);
    console.log(`[${syncId}]   - Atualizadas: ${updatedCount}`);
    console.log(`[${syncId}]   - Erros: ${errorCount}`);
    console.log(`[${syncId}]   - VPS total: ${vpsInstances.length}`);
    console.log(`[${syncId}]   - Supabase anterior: ${supabaseInstances?.length || 0}`);
    
    console.log(`[${syncId}] 📋 Log detalhado:`, syncLog);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          syncId,
          syncedCount,
          createdCount,
          updatedCount,
          errorCount,
          vpsInstancesCount: vpsInstances.length,
          supabaseInstancesCount: supabaseInstances?.length || 0,
          syncLog,
          message: `Sincronização concluída: ${createdCount} criadas, ${updatedCount} atualizadas, ${errorCount} erros`
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${syncId}] 💥 ERRO CRÍTICO na sincronização:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        syncId,
        timestamp: new Date().toISOString(),
        details: {
          vps_url: VPS_CONFIG.baseUrl,
          vps_headers: getVPSHeaders()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - VERSÃO CORRIGIDA ATIVA');
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

    // Processar webhook se for um webhook direto
    if (action === 'webhook' || body.event) {
      console.log('[WhatsApp Server] 🔔 WEBHOOK RECEIVED');
      const result = await processIncomingWebhook(supabase, body);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user for regular actions
    const user = await authenticateUser(req, supabase);
    console.log('[WhatsApp Server] 🔐 Usuário autenticado:', user.id, user.email);

    // Process action with enhanced error handling
    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🚀 CREATE INSTANCE');
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
        console.log('[WhatsApp Server] 📱 GET QR CODE ASYNC');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for get_qr_code_async action');
        }
        
        return await getQRCodeAsync(supabase, body.instanceData.instanceId, user.id);

      case 'refresh_qr_code':
        console.log('[WhatsApp Server] 📱 REFRESH QR CODE (alias para get_qr_code_async)');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for refresh_qr_code action');
        }
        
        return await getQRCodeAsync(supabase, body.instanceData.instanceId, user.id);

      case 'configure_webhook':
        console.log('[WhatsApp Server] 🔧 CONFIGURE WEBHOOK');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for configure_webhook action');
        }
        
        return await configureWebhookForInstance(body.instanceData.instanceId);

      case 'remove_webhook':
        console.log('[WhatsApp Server] 🗑️ REMOVE WEBHOOK');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for remove_webhook action');
        }
        
        return await removeWebhookForInstance(body.instanceData.instanceId);

      case 'check_server':
        console.log('[WhatsApp Server] 🏥 CHECK SERVER HEALTH');
        return await checkServerHealth();

      case 'get_server_info':
        console.log('[WhatsApp Server] 📊 GET SERVER INFO');
        return await getServerInfo();

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

      case 'get_status':
        console.log('[WhatsApp Server] 📊 GET INSTANCE STATUS');
        
        if (!body.instanceData?.instanceId) {
          throw new Error('Instance ID is required for get_status action');
        }
        
        return await getInstanceStatus(body.instanceData.instanceId);

      case 'sync_instances':
        console.log('[WhatsApp Server] 🔄 SYNC ALL INSTANCES (VERSÃO CORRIGIDA)');
        return await syncAllInstancesWithVPS(supabase);

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
          console.log('[WhatsApp Server] Parameters:', {
            phoneFilter: body.phoneFilter,
            userEmail: body.userEmail
          });
          return await bindByPhone(supabase, body.phoneFilter, body.userEmail);
        } else {
          console.error('[WhatsApp Server] ❌ Invalid parameters received:', {
            hasInstanceData: !!body.instanceData,
            instanceId: body.instanceData?.instanceId,
            userEmail: body.instanceData?.userEmail,
            phoneFilter: body.phoneFilter,
            rootUserEmail: body.userEmail
          });
          throw new Error('Invalid parameters for bind_instance_to_user action. Need either instanceData.instanceId+instanceData.userEmail or phoneFilter+userEmail');
        }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('[WhatsApp Server] 💥 ERRO GERAL:', error);
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
        action: 'error_handling',
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
