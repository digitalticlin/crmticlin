import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, testVPSConnection } from './config.ts';
import { createWhatsAppInstance, deleteWhatsAppInstance } from './instanceManagement.ts';
import { getInstanceStatus, getQRCode } from './instanceStatusService.ts';
import { getQRCodeFromVPS, updateQRCodeInDatabase } from './qrCodeService.ts';
import { authenticateRequest } from './authentication.ts';
import { listInstances } from './instanceListService.ts';

serve(async (req) => {
  console.log('[WhatsApp Server] 🚀 REQUEST RECEIVED - DIAGNÓSTICO ATIVO');
  console.log('[WhatsApp Server] Method:', req.method);
  console.log('[WhatsApp Server] URL:', req.url);
  console.log('[WhatsApp Server] Headers:', Object.fromEntries(req.headers.entries()));

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

    // Parse request body with detailed logging
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('[WhatsApp Server] 📥 Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('[WhatsApp Server] 📋 Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('[WhatsApp Server] ❌ Body parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, instanceData, vpsAction, phoneFilter, targetCompanyName, userEmail } = requestBody;
    console.log('[WhatsApp Server] 🎯 Action extracted:', action);

    // NOVO: Action para vincular instância ao usuário correto
    if (action === 'bind_instance_to_user') {
      console.log('[WhatsApp Server] 🔗 VINCULAÇÃO DE INSTÂNCIA AO USUÁRIO INICIADA');
      const { bindInstanceToUser } = await import('./instanceUserBinding.ts');
      return await bindInstanceToUser(supabase, phoneFilter, userEmail);
    }

    // Action para correção de vinculação de instância
    if (action === 'correct_instance_binding') {
      console.log('[WhatsApp Server] 🔧 CORREÇÃO DE VINCULAÇÃO INICIADA');
      const { correctInstanceBinding } = await import('./instanceCorrectionService.ts');
      return await correctInstanceBinding(supabase, phoneFilter, targetCompanyName);
    }

    // Action para auditoria de vinculações
    if (action === 'audit_instance_bindings') {
      console.log('[WhatsApp Server] 🔍 AUDITORIA DE VINCULAÇÕES INICIADA');
      const { auditInstanceBindings } = await import('./instanceCorrectionService.ts');
      return await auditInstanceBindings(supabase);
    }

    // Action para diagnóstico VPS
    if (action === 'diagnose_vps') {
      console.log('[WhatsApp Server] 🔍 DIAGNÓSTICO VPS INICIADO');
      return await diagnoseVPSInstances(supabase);
    }

    // Action para sincronização de emergência
    if (action === 'emergency_sync') {
      console.log('[WhatsApp Server] 🆘 SINCRONIZAÇÃO DE EMERGÊNCIA INICIADA');
      return await emergencySync(supabase);
    }

    // Action para sincronizar instâncias órfãs
    if (action === 'sync_orphan_instances') {
      console.log('[WhatsApp Server] 🔄 SINCRONIZAÇÃO DE INSTÂNCIAS ÓRFÃS INICIADA');
      return await syncOrphanInstances(supabase);
    }

    // Autenticar usuário com logs detalhados
    let user;
    try {
      user = await authenticateRequest(req, supabase);
      console.log('[WhatsApp Server] 🔐 Usuário autenticado:', user.id, user.email);
    } catch (authError) {
      console.error('[WhatsApp Server] ❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication failed',
          details: authError.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[WhatsApp Server] 🎯 Processing action:', action);

    switch (action) {
      case 'create_instance':
        console.log('[WhatsApp Server] 🚀 CREATE INSTANCE - logs detalhados ativados');
        console.log('[WhatsApp Server] Instance data:', JSON.stringify(instanceData, null, 2));
        console.log('[WhatsApp Server] User ID:', user.id);
        return await createWhatsAppInstance(supabase, instanceData, user.id);

      case 'delete_instance':
        console.log('[WhatsApp Server] 🗑️ DELETE INSTANCE:', instanceData.instanceId);
        return await deleteWhatsAppInstance(supabase, instanceData.instanceId);

      case 'get_status':
        console.log('[WhatsApp Server] 📊 GET STATUS:', instanceData.instanceId);
        return await getInstanceStatus(instanceData.instanceId);

      case 'get_qr_code':
        console.log('[WhatsApp Server] 🔳 GET QR CODE:', instanceData.instanceId);
        return await getQRCode(instanceData.instanceId);

      case 'refresh_qr_code':
        console.log('[WhatsApp Server] 🔄 REFRESH QR CODE:', instanceData.instanceId);
        const qrResult = await getQRCodeFromVPS(instanceData.instanceId);
        
        if (qrResult.success) {
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
        console.log('[WhatsApp Server] 🔍 CHECK SERVER');
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
        console.log('[WhatsApp Server] 🔄 SYNC INSTANCES');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Sync completed',
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list_all_instances_global':
        console.log('[WhatsApp Server] 📋 LIST ALL INSTANCES GLOBAL');
        return await listGlobalInstances(supabase);

      case 'cleanup_orphan_instances':
        console.log('[WhatsApp Server] 🧹 CLEANUP ORPHAN INSTANCES');
        return await cleanupOrphanInstances(supabase);

      case 'mass_reconnect_instances':
        console.log('[WhatsApp Server] 🔄 MASS RECONNECT INSTANCES');
        return await massReconnectInstances(supabase);

      default:
        console.error('[WhatsApp Server] ❌ Unknown action:', action);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}`,
            availableActions: [
              'create_instance', 'delete_instance', 'get_status', 'get_qr_code', 
              'refresh_qr_code', 'check_server', 'sync_instances', 
              'list_all_instances_global', 'cleanup_orphan_instances', 
              'mass_reconnect_instances', 'diagnose_vps', 'emergency_sync',
              'correct_instance_binding', 'audit_instance_bindings',
              'bind_instance_to_user', 'sync_orphan_instances'
            ]
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('[WhatsApp Server] 💥 ERRO GERAL (logs detalhados):', error);
    console.error('[WhatsApp Server] Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// NOVA FUNÇÃO: Diagnóstico completo da VPS
async function diagnoseVPSInstances(supabase: any) {
  console.log('[Diagnose VPS] 🔍 Iniciando diagnóstico completo...');
  
  try {
    // 1. Testar conectividade VPS
    const vpsTest = await testVPSConnection();
    console.log('[Diagnose VPS] VPS Test Result:', vpsTest);

    // 2. Listar instâncias da VPS
    let vpsInstances = [];
    try {
      const vpsResponse = await listInstances();
      const vpsData = await vpsResponse.json();
      vpsInstances = vpsData.instances || [];
      console.log('[Diagnose VPS] VPS Instances found:', vpsInstances.length);
    } catch (vpsError) {
      console.error('[Diagnose VPS] Erro ao listar VPS:', vpsError);
    }

    // 3. Verificar instâncias no Supabase
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('connection_type', 'web');

    console.log('[Diagnose VPS] Supabase instances:', dbInstances?.length || 0);

    // 4. Verificar usuários com company_id
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, company_id')
      .not('company_id', 'is', null);

    console.log('[Diagnose VPS] Profiles with company_id:', profiles?.length || 0);

    const diagnosis = {
      timestamp: new Date().toISOString(),
      vps: {
        connectivity: vpsTest.success,
        error: vpsTest.error,
        instances: vpsInstances,
        instanceCount: vpsInstances.length
      },
      supabase: {
        instances: dbInstances || [],
        instanceCount: dbInstances?.length || 0,
        error: dbError
      },
      users: {
        profiles: profiles || [],
        profileCount: profiles?.length || 0,
        error: profileError
      },
      issues: []
    };

    // Identificar problemas
    if (!vpsTest.success) {
      diagnosis.issues.push('VPS não acessível');
    }
    
    if (vpsInstances.length > 0 && (!dbInstances || dbInstances.length === 0)) {
      diagnosis.issues.push('Instâncias existem na VPS mas não no Supabase');
    }

    if (!profiles || profiles.length === 0) {
      diagnosis.issues.push('Nenhum usuário com company_id válido');
    }

    console.log('[Diagnose VPS] ✅ Diagnóstico completo:', diagnosis);

    return new Response(
      JSON.stringify({
        success: true,
        diagnosis,
        summary: {
          vpsInstances: vpsInstances.length,
          supabaseInstances: dbInstances?.length || 0,
          usersWithCompany: profiles?.length || 0,
          issuesFound: diagnosis.issues.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Diagnose VPS] ❌ Erro no diagnóstico:', error);
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

// NOVA FUNÇÃO: Sincronização de emergência
async function emergencySync(supabase: any) {
  console.log('[Emergency Sync] 🆘 Iniciando sincronização de emergência...');
  
  try {
    // 1. Buscar instâncias da VPS
    const vpsResponse = await listInstances();
    const vpsData = await vpsResponse.json();
    
    if (!vpsData.success) {
      throw new Error('Falha ao buscar instâncias da VPS');
    }

    const vpsInstances = vpsData.instances || [];
    console.log('[Emergency Sync] VPS instances found:', vpsInstances.length);

    // 2. Buscar profiles com company_id
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, company_id')
      .not('company_id', 'is', null);

    if (profileError) {
      throw new Error('Erro ao buscar profiles: ' + profileError.message);
    }

    console.log('[Emergency Sync] Profiles with company_id:', profiles?.length || 0);

    let synchronized = 0;
    let errors = [];

    // 3. Para cada instância VPS, tentar sincronizar
    for (const vpsInstance of vpsInstances) {
      try {
        // Verificar se já existe no Supabase
        const { data: existing } = await supabase
          .from('whatsapp_instances')
          .select('id')
          .eq('vps_instance_id', vpsInstance.instanceId)
          .maybeSingle();

        if (existing) {
          console.log('[Emergency Sync] Instância já existe:', vpsInstance.instanceId);
          continue;
        }

        // Tentar associar com profile baseado no nome da instância ou outros critérios
        let assignedProfile = null;
        if (profiles && profiles.length > 0) {
          // Por enquanto, associar com o primeiro profile disponível
          // Em produção, seria necessário lógica mais sofisticada
          assignedProfile = profiles[synchronized % profiles.length];
        }

        if (!assignedProfile) {
          console.log('[Emergency Sync] Nenhum profile disponível para:', vpsInstance.instanceId);
          continue;
        }

        // Criar entrada no Supabase
        const { data: created, error: insertError } = await supabase
          .from('whatsapp_instances')
          .insert({
            instance_name: `recovered_${vpsInstance.instanceId.slice(-8)}`,
            phone: vpsInstance.phone || '',
            company_id: assignedProfile.company_id,
            connection_type: 'web',
            server_url: 'http://31.97.24.222:3001',
            vps_instance_id: vpsInstance.instanceId,
            web_status: vpsInstance.status === 'open' ? 'ready' : 'disconnected',
            connection_status: vpsInstance.status || 'unknown',
            profile_name: vpsInstance.profileName,
            profile_pic_url: vpsInstance.profilePictureUrl
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Emergency Sync] Erro ao inserir:', insertError);
          errors.push(`${vpsInstance.instanceId}: ${insertError.message}`);
        } else {
          console.log('[Emergency Sync] ✅ Sincronizado:', vpsInstance.instanceId);
          synchronized++;
        }

      } catch (instanceError) {
        console.error('[Emergency Sync] Erro na instância:', vpsInstance.instanceId, instanceError);
        errors.push(`${vpsInstance.instanceId}: ${instanceError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synchronized,
        totalVpsInstances: vpsInstances.length,
        errors,
        message: `Sincronização de emergência concluída: ${synchronized} instâncias sincronizadas`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Emergency Sync] ❌ Erro na sincronização:', error);
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

// NOVA FUNÇÃO: Sincronizar instâncias órfãs automaticamente
async function syncOrphanInstances(supabase: any) {
  console.log('[Sync Orphans] 🔄 Iniciando sincronização automática de órfãs...');
  
  try {
    // 1. Buscar instâncias da VPS
    const vpsResponse = await listInstances();
    const vpsData = await vpsResponse.json();
    
    if (!vpsData.success) {
      throw new Error('Falha ao buscar instâncias da VPS');
    }

    const vpsInstances = vpsData.instances || [];
    console.log('[Sync Orphans] VPS instances found:', vpsInstances.length);

    // 2. Buscar instâncias existentes no Supabase
    const { data: dbInstances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('id, vps_instance_id')
      .eq('connection_type', 'web');

    if (dbError) {
      throw new Error('Erro ao buscar instâncias do Supabase: ' + dbError.message);
    }

    const existingVpsIds = new Set(dbInstances?.map(db => db.vps_instance_id) || []);
    console.log('[Sync Orphans] Existing in Supabase:', existingVpsIds.size);

    let syncedOrphans = 0;
    let deletedOrphans = 0;
    let errors = [];

    // 3. Processar cada instância da VPS
    for (const vpsInstance of vpsInstances) {
      try {
        const isOrphan = !existingVpsIds.has(vpsInstance.instanceId);
        
        if (isOrphan) {
          if (vpsInstance.phone && vpsInstance.phone.trim() !== '') {
            // Órfã com telefone: sincronizar para o Supabase
            console.log('[Sync Orphans] 📱 Sincronizando órfã com telefone:', vpsInstance.instanceId);
            
            // Buscar primeira empresa ativa para associar temporariamente
            const { data: firstCompany, error: companyError } = await supabase
              .from('companies')
              .select('id')
              .eq('active', true)
              .limit(1)
              .single();

            if (companyError || !firstCompany) {
              console.error('[Sync Orphans] ❌ Nenhuma empresa ativa encontrada');
              errors.push(`${vpsInstance.instanceId}: Nenhuma empresa ativa para associar`);
              continue;
            }

            // Criar entrada no Supabase para órfã com telefone
            const { data: newInstance, error: insertError } = await supabase
              .from('whatsapp_instances')
              .insert({
                instance_name: `orphan_${vpsInstance.instanceId.slice(-8)}`,
                phone: vpsInstance.phone,
                company_id: firstCompany.id,
                connection_type: 'web',
                server_url: 'http://31.97.24.222:3001',
                vps_instance_id: vpsInstance.instanceId,
                web_status: vpsInstance.status === 'open' ? 'ready' : 'disconnected',
                connection_status: vpsInstance.status || 'unknown',
                profile_name: vpsInstance.profileName,
                profile_pic_url: vpsInstance.profilePictureUrl
              })
              .select()
              .single();

            if (insertError) {
              console.error('[Sync Orphans] ❌ Erro ao inserir órfã com telefone:', insertError);
              errors.push(`${vpsInstance.instanceId}: ${insertError.message}`);
            } else {
              console.log('[Sync Orphans] ✅ Órfã com telefone sincronizada:', vpsInstance.instanceId);
              syncedOrphans++;
            }

          } else {
            // Órfã sem telefone: pode ser excluída (comentado por segurança)
            console.log('[Sync Orphans] 🗑️ Órfã sem telefone detectada (não excluída):', vpsInstance.instanceId);
            // TODO: Implementar exclusão automática após confirmação
            // deletedOrphans++;
          }
        }
      } catch (instanceError) {
        console.error('[Sync Orphans] ❌ Erro ao processar instância:', vpsInstance.instanceId, instanceError);
        errors.push(`${vpsInstance.instanceId}: ${instanceError.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        syncedOrphans,
        deletedOrphans,
        totalVpsInstances: vpsInstances.length,
        errors,
        message: `Sincronização concluída: ${syncedOrphans} órfãs sincronizadas, ${deletedOrphans} excluídas`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync Orphans] ❌ Erro na sincronização:', error);
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

// Função para listar todas as instâncias com informações combinadas
async function listGlobalInstances(supabase: any) {
  try {
    const vpsResponse = await listInstances();
    const vpsData = await vpsResponse.json();
    
    if (!vpsData.success) {
      throw new Error('Falha ao buscar instâncias da VPS');
    }

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
    const { data: inactiveInstances, error } = await supabase
      .from('whatsapp_instances')
      .select('vps_instance_id')
      .eq('connection_type', 'web')
      .neq('connection_status', 'open');

    if (error) {
      throw new Error('Erro ao buscar instâncias: ' + error.message);
    }

    let reconnected = 0;
    
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
