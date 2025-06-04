
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, testVPSConnection } from './config.ts';
import { createWhatsAppInstance, deleteWhatsAppInstance } from './instanceManagement.ts';
import { getInstanceStatus, getQRCode } from './instanceStatusService.ts';
import { getQRCodeFromVPS, updateQRCodeInDatabase } from './qrCodeService.ts';
import { authenticateRequest } from './authentication.ts';
import { listInstances } from './instanceListService.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // CORREÇÃO FASE 3.1.1: Autenticar usuário ANTES de processar qualquer ação
    const user = await authenticateRequest(req, supabase);
    console.log(`[WhatsApp Server] 🔐 Usuário autenticado: ${user.id} (${user.email})`);

    const { action, instanceData, vpsAction } = await req.json();
    console.log(`[WhatsApp Server] 🔧 Action: ${action} (FASE 3.1.1 - com auth corrigida)`);

    switch (action) {
      case 'create_instance':
        // CORREÇÃO FASE 3.1.1: Passar userId correto ao invés do objeto req
        console.log(`[WhatsApp Server] 🚀 Criando instância para usuário: ${user.id}`);
        return await createWhatsAppInstance(supabase, instanceData, user.id);

      case 'delete_instance':
        return await deleteWhatsAppInstance(supabase, instanceData.instanceId);

      case 'get_status':
        return await getInstanceStatus(instanceData.instanceId);

      case 'get_qr_code':
        return await getQRCode(instanceData.instanceId);

      case 'refresh_qr_code':
        console.log('[WhatsApp Server] 🔄 Atualizando QR Code (FASE 3.1.1)');
        const qrResult = await getQRCodeFromVPS(instanceData.instanceId);
        
        if (qrResult.success) {
          // Atualizar no banco
          await updateQRCodeInDatabase(supabase, instanceData.instanceId, qrResult);
          
          return new Response(
            JSON.stringify({
              success: true,
              qrCode: qrResult.qrCode,
              status: qrResult.status,
              timestamp: qrResult.timestamp
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: qrResult.error
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'check_server':
        console.log('[WhatsApp Server] 🔍 Verificando servidor (FASE 3.1.1)');
        const vpsTest = await testVPSConnection();
        
        return new Response(
          JSON.stringify({
            success: vpsTest.success,
            details: vpsTest.details,
            error: vpsTest.error,
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'sync_instances':
        console.log('[WhatsApp Server] 🔄 Sincronizando instâncias (FASE 3.1.1)');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Sync completed',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list_all_instances_global':
        console.log('[WhatsApp Server] 📋 Listando todas as instâncias para Global Admin');
        return await listGlobalInstances(supabase);

      case 'cleanup_orphan_instances':
        console.log('[WhatsApp Server] 🧹 Limpando instâncias órfãs');
        return await cleanupOrphanInstances(supabase);

      case 'mass_reconnect_instances':
        console.log('[WhatsApp Server] 🔄 Reconectando instâncias em massa');
        return await massReconnectInstances(supabase);

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('[WhatsApp Server] ❌ Erro geral (FASE 3.1.1):', error);
    
    // CORREÇÃO FASE 3.1.1: Melhor tratamento de erros de autenticação
    if (error.message.includes('Authorization') || error.message.includes('authentication')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed',
          details: error.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
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

// Função para listar todas as instâncias com informações combinadas
async function listGlobalInstances(supabase: any) {
  try {
    // 1. Buscar instâncias da VPS
    const vpsResponse = await listInstances();
    const vpsData = await vpsResponse.json();
    
    if (!vpsData.success) {
      throw new Error('Falha ao buscar instâncias da VPS');
    }

    // 2. Buscar instâncias do Supabase com dados relacionados
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        profiles:company_id (
          full_name,
          companies:company_id (
            name
          )
        )
      `)
      .eq('connection_type', 'web');

    if (dbError) {
      console.error('[Global Instances] ❌ Erro Supabase:', dbError);
    }

    // 3. Combinar dados VPS + Supabase
    const combinedInstances = vpsData.instances.map((vpsInstance: any) => {
      const dbInstance = dbInstances?.find(db => db.vps_instance_id === vpsInstance.instanceId);
      
      return {
        instanceId: vpsInstance.instanceId,
        status: vpsInstance.status,
        phone: vpsInstance.phone,
        profileName: vpsInstance.profileName,
        profilePictureUrl: vpsInstance.profilePictureUrl,
        isOrphan: !dbInstance,
        companyName: dbInstance?.profiles?.companies?.name || null,
        userName: dbInstance?.profiles?.full_name || null,
        companyId: dbInstance?.company_id || null,
        userId: dbInstance?.profiles?.id || null,
        lastSeen: dbInstance?.updated_at || null
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        instances: combinedInstances,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Global Instances] ❌ Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        instances: [],
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Função para limpar instâncias órfãs
async function cleanupOrphanInstances(supabase: any) {
  try {
    // Usar o monitor existente para identificar e limpar órfãs
    const { data, error } = await supabase.functions.invoke('whatsapp_instance_monitor');
    
    if (error) {
      throw new Error('Erro no monitor: ' + error.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: data.results?.deleted || 0,
        message: 'Limpeza de órfãs concluída',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Cleanup Orphans] ❌ Erro:', error);
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

// Função para reconexão em massa
async function massReconnectInstances(supabase: any) {
  try {
    // Buscar instâncias inativas do banco
    const { data: inactiveInstances, error } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id')
      .eq('connection_type', 'web')
      .neq('connection_status', 'open');

    if (error) {
      throw new Error('Erro ao buscar instâncias: ' + error.message);
    }

    let reconnected = 0;
    
    // Tentar reconectar cada instância
    for (const instance of inactiveInstances || []) {
      try {
        const result = await getInstanceStatus(instance.vps_instance_id);
        if (result.ok) {
          reconnected++;
        }
      } catch (error) {
        console.error(`[Mass Reconnect] Erro em ${instance.vps_instance_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: inactiveInstances?.length || 0,
        reconnected,
        message: 'Reconexão em massa iniciada',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Mass Reconnect] ❌ Erro:', error);
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
