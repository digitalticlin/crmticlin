
import { corsHeaders, VPS_CONFIG, getVPSHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';

export async function recoverOrphanInstances(supabase: any, userId: string) {
  console.log('[Orphan Recovery] 🔄 Iniciando recuperação de instâncias órfãs para usuário:', userId);
  
  try {
    // Obter dados da empresa do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

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
    
    console.log('[Orphan Recovery] 📋 VPS instances encontradas:', vpsInstances.length);

    // Obter instâncias existentes no Supabase
    const { data: supabaseInstances, error: supabaseError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('connection_type', 'web');

    if (supabaseError) {
      throw new Error(`Supabase query failed: ${supabaseError.message}`);
    }

    console.log('[Orphan Recovery] 📋 Supabase instances encontradas:', supabaseInstances?.length || 0);

    let recoveredCount = 0;
    const recoveredInstances = [];

    // Procurar por instâncias na VPS que não estão no Supabase
    for (const vpsInstance of vpsInstances) {
      const existsInSupabase = supabaseInstances?.find(si => si.vps_instance_id === vpsInstance.instanceId);
      
      if (!existsInSupabase && vpsInstance.status === 'open') {
        console.log('[Orphan Recovery] 🔍 Instância órfã encontrada:', vpsInstance.instanceId);
        
        // Criar instância no Supabase
        const instanceToRecover = {
          instance_name: vpsInstance.sessionName || vpsInstance.instanceId,
          phone: vpsInstance.phone || '',
          company_id: profile.company_id,
          connection_type: 'web',
          server_url: VPS_CONFIG.baseUrl,
          vps_instance_id: vpsInstance.instanceId,
          web_status: vpsInstance.state || 'connected',
          connection_status: vpsInstance.status || 'open',
          qr_code: null,
          profile_name: vpsInstance.profileName || null,
          profile_pic_url: vpsInstance.profilePicUrl || null
        };

        const { data: recoveredInstance, error: recoverError } = await supabase
          .from('whatsapp_instances')
          .insert(instanceToRecover)
          .select()
          .single();

        if (!recoverError) {
          recoveredCount++;
          recoveredInstances.push(recoveredInstance);
          console.log('[Orphan Recovery] ✅ Instância recuperada:', recoveredInstance.id);
        } else {
          console.error('[Orphan Recovery] ❌ Erro ao recuperar instância:', recoverError);
        }
      }
    }

    console.log('[Orphan Recovery] ✅ Recuperação concluída:', {
      recoveredCount,
      totalVpsInstances: vpsInstances.length,
      totalSupabaseInstances: supabaseInstances?.length || 0
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          recoveredCount,
          recoveredInstances,
          totalVpsInstances: vpsInstances.length,
          totalSupabaseInstances: supabaseInstances?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Orphan Recovery] 💥 Erro na recuperação:', error);
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
