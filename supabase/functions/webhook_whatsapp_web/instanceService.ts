
import { WhatsAppInstance } from './types.ts';

export async function findInstance(supabase: any, instanceName: string): Promise<WhatsAppInstance | null> {
  console.log('[Instance Service] 🔍 Searching for instance:', instanceName);
  
  // Buscar instância pelo vps_instance_id
  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select(`
      *,
      companies!inner (
        id,
        name
      )
    `)
    .eq('vps_instance_id', instanceName)
    .eq('connection_type', 'web')
    .maybeSingle();

  if (instanceError || !instance) {
    console.error('[Instance Service] ❌ Instance not found by VPS ID:', instanceName, instanceError);
    
    // CORREÇÃO: Tentar buscar por instance_name como fallback
    const { data: fallbackInstance, error: fallbackError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        companies!inner (
          id,
          name
        )
      `)
      .eq('instance_name', instanceName)
      .eq('connection_type', 'web')
      .maybeSingle();

    if (fallbackError || !fallbackInstance) {
      console.error('[Instance Service] ❌ Instance not found by name either:', instanceName);
      return null;
    }
    
    console.log('[Instance Service] ✅ Instance found via fallback (name):', fallbackInstance.instance_name);
    return fallbackInstance;
  }

  console.log('[Instance Service] ✅ Instance found by VPS ID:', {
    id: instance.id,
    company: instance.companies?.name,
    company_id: instance.company_id
  });

  return instance;
}
