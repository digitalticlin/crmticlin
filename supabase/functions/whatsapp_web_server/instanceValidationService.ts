
export async function validateInstanceCreationParams(instanceData: any, userId: string): Promise<void> {
  if (!userId || typeof userId !== 'string') {
    console.error('[Validation] ❌ User ID inválido:', userId);
    throw new Error('User ID is required and must be a valid string');
  }

  if (!instanceData?.instanceName) {
    console.error('[Validation] ❌ Instance name inválido:', instanceData);
    throw new Error('Instance name is required');
  }
}

export async function getUserCompany(supabase: any, userId: string): Promise<any> {
  console.log(`[Validation] 🏢 Buscando company_id para usuário: ${userId}`);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('[Validation] ❌ Erro ao buscar profile:', profileError);
    throw new Error(`Profile not found for user: ${profileError.message}`);
  }

  if (!profile?.company_id) {
    console.error('[Validation] ❌ Company ID não encontrado para usuário:', userId);
    throw new Error('User company not found');
  }

  console.log(`[Validation] ✅ Company ID encontrado: ${profile.company_id}`);
  return profile;
}

export async function validateInstanceNameUniqueness(supabase: any, companyId: string, instanceName: string): Promise<void> {
  console.log('[Validation] 🔍 Validando unicidade do nome...');
  
  const { data: existingInstance } = await supabase
    .from('whatsapp_instances')
    .select('id')
    .eq('company_id', companyId)
    .eq('instance_name', instanceName)
    .maybeSingle();

  if (existingInstance) {
    throw new Error(`Instância com nome "${instanceName}" já existe. Tente com outro nome.`);
  }
}

export async function cleanupOrphanedInstances(supabase: any, companyId: string, instanceName: string): Promise<void> {
  console.log('[Validation] 🧹 Limpando instâncias órfãs...');
  
  const { data: orphanedInstances } = await supabase
    .from('whatsapp_instances')
    .select('id, instance_name, vps_instance_id')
    .eq('company_id', companyId)
    .eq('instance_name', instanceName);

  if (orphanedInstances && orphanedInstances.length > 0) {
    console.log(`[Validation] Found ${orphanedInstances.length} potential orphaned instances with same name`);
    
    // Delete orphaned instances (those without proper VPS connection)
    for (const orphan of orphanedInstances) {
      if (!orphan.vps_instance_id || orphan.vps_instance_id === '') {
        console.log(`[Validation] 🗑️ Cleaning up orphaned instance: ${orphan.id}`);
        await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', orphan.id);
      }
    }
  }
}
