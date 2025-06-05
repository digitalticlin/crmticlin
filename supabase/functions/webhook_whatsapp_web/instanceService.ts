
export async function findInstance(supabase: any, instanceName: string) {
  console.log('[Instance Service] 🔍 Buscando instância:', instanceName);
  
  try {
    // Buscar por vps_instance_id primeiro (mais comum)
    let { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceName)
      .single();

    // Se não encontrou, buscar por instance_name
    if (error || !instance) {
      console.log('[Instance Service] 🔄 Tentando buscar por instance_name');
      
      const result = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();
      
      instance = result.data;
      error = result.error;
    }

    if (error || !instance) {
      console.error('[Instance Service] ❌ Instância não encontrada:', error);
      return null;
    }

    console.log('[Instance Service] ✅ Instância encontrada:', {
      id: instance.id,
      instance_name: instance.instance_name,
      vps_instance_id: instance.vps_instance_id,
      company_id: instance.company_id
    });

    return instance;

  } catch (error) {
    console.error('[Instance Service] ❌ Erro na busca:', error);
    return null;
  }
}
