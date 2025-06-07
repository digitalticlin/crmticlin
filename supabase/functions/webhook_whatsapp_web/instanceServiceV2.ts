
export async function findInstanceV2(supabase: any, vpsInstanceId: string) {
  console.log('[Instance Service V2] 🔍 Buscando instância por vps_instance_id:', vpsInstanceId);
  
  try {
    // CORREÇÃO: Buscar por vps_instance_id que é o correto vindo da VPS
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', vpsInstanceId)
      .single();

    if (error) {
      console.error('[Instance Service V2] ❌ Erro ao buscar instância:', error);
      return null;
    }

    if (!instance) {
      console.warn('[Instance Service V2] ⚠️ Instância não encontrada:', vpsInstanceId);
      return null;
    }

    console.log('[Instance Service V2] ✅ Instância encontrada:', {
      id: instance.id,
      name: instance.instance_name,
      vpsInstanceId: instance.vps_instance_id
    });

    return instance;
  } catch (error) {
    console.error('[Instance Service V2] ❌ Erro geral:', error);
    return null;
  }
}
