
export async function findInstance(supabase: any, instanceName: string) {
  console.log('[Instance Service] 🔍 Buscando instância:', instanceName);
  
  try {
    // CORREÇÃO: Buscar por vps_instance_id que corresponde ao instanceName vindo da VPS
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceName)
      .single();

    if (error) {
      console.error('[Instance Service] ❌ Erro ao buscar instância:', error);
      return null;
    }

    if (!instance) {
      console.warn('[Instance Service] ⚠️ Instância não encontrada:', instanceName);
      return null;
    }

    console.log('[Instance Service] ✅ Instância encontrada:', {
      id: instance.id,
      name: instance.instance_name,
      vpsInstanceId: instance.vps_instance_id
    });

    return instance;
  } catch (error) {
    console.error('[Instance Service] ❌ Erro geral:', error);
    return null;
  }
}
