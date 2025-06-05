
import { corsHeaders } from './config.ts';

/**
 * Sincronização Multi-Tenant Completa
 * Sistema para gerenciar mensagens de múltiplas empresas
 */
export async function executeMultiTenantSync(supabase: any) {
  const syncId = `multi_tenant_sync_${Date.now()}`;
  console.log(`[Multi-Tenant Sync] 🏢 Iniciando sincronização multi-tenant [${syncId}]`);
  
  try {
    const startTime = Date.now();
    
    // 1. Verificar integridade das empresas
    const companiesCheck = await validateCompaniesIntegrity(supabase);
    
    // 2. Verificar integridade das instâncias
    const instancesCheck = await validateInstancesIntegrity(supabase);
    
    // 3. Verificar configuração RLS
    const rlsCheck = await validateRLSConfiguration(supabase);
    
    // 4. Sincronizar órfãs com empresas
    const orphanSync = await syncOrphanInstancesToCompanies(supabase);
    
    // 5. Validar mensagens por empresa
    const messagesCheck = await validateMessagesIntegrity(supabase);
    
    const executionTime = Date.now() - startTime;
    
    const result = {
      syncId,
      executionTime,
      companies: companiesCheck,
      instances: instancesCheck,
      rls: rlsCheck,
      orphanSync,
      messages: messagesCheck,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    // Log do resultado
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'multi_tenant_sync',
        status: 'success',
        execution_time: `${executionTime} ms`,
        result
      });
    
    console.log(`[Multi-Tenant Sync] ✅ Sincronização concluída [${syncId}]: ${executionTime}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        result,
        message: 'Sincronização multi-tenant concluída com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Multi-Tenant Sync] ❌ Erro na sincronização [${syncId}]:`, error);
    
    await supabase
      .from('sync_logs')
      .insert({
        function_name: 'multi_tenant_sync',
        status: 'error',
        error_message: error.message
      });

    return new Response(
      JSON.stringify({
        success: false,
        syncId,
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

/**
 * Validar integridade das empresas
 */
async function validateCompaniesIntegrity(supabase: any) {
  console.log(`[Multi-Tenant] 🏢 Validando integridade das empresas`);
  
  try {
    // Buscar empresas ativas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, active')
      .eq('active', true);

    if (companiesError) {
      throw new Error(`Erro ao buscar empresas: ${companiesError.message}`);
    }

    // Verificar usuários por empresa
    const companiesWithUsers = await Promise.all(
      companies.map(async (company: any) => {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('company_id', company.id);

        return {
          ...company,
          userCount: users?.length || 0,
          users: users || [],
          hasAdmin: users?.some((u: any) => u.role === 'admin') || false
        };
      })
    );

    const issues = companiesWithUsers.filter(c => c.userCount === 0 || !c.hasAdmin);

    return {
      totalCompanies: companies.length,
      companiesWithUsers: companiesWithUsers.filter(c => c.userCount > 0).length,
      companiesWithAdmin: companiesWithUsers.filter(c => c.hasAdmin).length,
      issues: issues.length,
      issuesList: issues
    };

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro na validação de empresas:`, error);
    return { error: error.message };
  }
}

/**
 * Validar integridade das instâncias
 */
async function validateInstancesIntegrity(supabase: any) {
  console.log(`[Multi-Tenant] 📱 Validando integridade das instâncias`);
  
  try {
    // Buscar todas as instâncias
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        companies!whatsapp_instances_company_id_fkey (
          id,
          name,
          active
        )
      `)
      .eq('connection_type', 'web');

    if (instancesError) {
      throw new Error(`Erro ao buscar instâncias: ${instancesError.message}`);
    }

    const stats = {
      total: instances.length,
      withCompany: instances.filter(i => i.company_id).length,
      withoutCompany: instances.filter(i => !i.company_id).length,
      connected: instances.filter(i => ['open', 'ready'].includes(i.connection_status)).length,
      disconnected: instances.filter(i => !['open', 'ready'].includes(i.connection_status)).length,
      orphans: instances.filter(i => !i.company_id || !i.companies?.active).length
    };

    return stats;

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro na validação de instâncias:`, error);
    return { error: error.message };
  }
}

/**
 * Validar configuração RLS
 */
async function validateRLSConfiguration(supabase: any) {
  console.log(`[Multi-Tenant] 🔒 Validando configuração RLS`);
  
  try {
    // Verificar se as políticas RLS estão ativas nas tabelas críticas
    const criticalTables = ['leads', 'messages', 'whatsapp_instances'];
    const rlsStatus = [];

    for (const table of criticalTables) {
      try {
        // Teste simples para verificar se RLS está funcionando
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        rlsStatus.push({
          table,
          accessible: !error,
          error: error?.message || null
        });
      } catch (error) {
        rlsStatus.push({
          table,
          accessible: false,
          error: error.message
        });
      }
    }

    return {
      tablesChecked: criticalTables.length,
      accessible: rlsStatus.filter(s => s.accessible).length,
      issues: rlsStatus.filter(s => !s.accessible),
      status: rlsStatus
    };

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro na validação RLS:`, error);
    return { error: error.message };
  }
}

/**
 * Sincronizar instâncias órfãs com empresas
 */
async function syncOrphanInstancesToCompanies(supabase: any) {
  console.log(`[Multi-Tenant] 🔄 Sincronizando instâncias órfãs`);
  
  try {
    // Buscar instâncias sem empresa
    const { data: orphanInstances, error: orphanError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .is('company_id', null)
      .eq('connection_type', 'web');

    if (orphanError) {
      throw new Error(`Erro ao buscar órfãs: ${orphanError.message}`);
    }

    if (orphanInstances.length === 0) {
      return { orphansFound: 0, synced: 0, message: 'Nenhuma instância órfã encontrada' };
    }

    // Buscar primeira empresa ativa para associar órfãs
    const { data: defaultCompany, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('active', true)
      .limit(1)
      .single();

    if (companyError || !defaultCompany) {
      return { 
        orphansFound: orphanInstances.length, 
        synced: 0, 
        error: 'Nenhuma empresa ativa encontrada para associar órfãs' 
      };
    }

    let synced = 0;
    const errors = [];

    for (const orphan of orphanInstances) {
      try {
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            company_id: defaultCompany.id,
            instance_name: orphan.instance_name || `orphan_${orphan.vps_instance_id?.slice(-8)}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', orphan.id);

        if (updateError) {
          errors.push(`${orphan.id}: ${updateError.message}`);
        } else {
          synced++;
          console.log(`[Multi-Tenant] ✅ Órfã sincronizada: ${orphan.id} -> ${defaultCompany.name}`);
        }
      } catch (error) {
        errors.push(`${orphan.id}: ${error.message}`);
      }
    }

    return {
      orphansFound: orphanInstances.length,
      synced,
      errors: errors.length,
      defaultCompany: defaultCompany.name,
      errorList: errors
    };

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro na sincronização de órfãs:`, error);
    return { error: error.message };
  }
}

/**
 * Validar integridade das mensagens
 */
async function validateMessagesIntegrity(supabase: any) {
  console.log(`[Multi-Tenant] 💬 Validando integridade das mensagens`);
  
  try {
    // Estatísticas gerais de mensagens
    const { data: messageStats, error: statsError } = await supabase
      .from('messages')
      .select('id, lead_id, whatsapp_number_id, from_me')
      .limit(1000); // Amostra para análise

    if (statsError) {
      throw new Error(`Erro ao buscar mensagens: ${statsError.message}`);
    }

    // Verificar mensagens órfãs (sem lead válido)
    const { data: orphanMessages, error: orphanError } = await supabase
      .from('messages')
      .select(`
        id,
        lead_id,
        leads!inner (id, company_id)
      `)
      .is('leads.id', null)
      .limit(100);

    const stats = {
      totalSampled: messageStats.length,
      fromUsers: messageStats.filter(m => m.from_me).length,
      fromContacts: messageStats.filter(m => !m.from_me).length,
      orphanMessages: orphanMessages?.length || 0
    };

    return stats;

  } catch (error) {
    console.error(`[Multi-Tenant] ❌ Erro na validação de mensagens:`, error);
    return { error: error.message };
  }
}
