
import { corsHeaders } from './config.ts';

export async function bindInstanceToUser(supabase: any, phoneFilter: string, userEmail: string) {
  const bindingId = `bind_${Date.now()}`;
  console.log(`[Instance Binding] 🔗 Iniciando vinculação [${bindingId}]:`, { phoneFilter, userEmail });
  
  try {
    // 1. Validar parâmetros
    if (!phoneFilter || !userEmail) {
      throw new Error('Telefone e email são obrigatórios');
    }

    // 2. Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, company_id, companies!profiles_company_id_fkey(name)')
      .eq('id', (await supabase.auth.admin.getUserByEmail(userEmail)).data?.user?.id)
      .single();

    if (userError || !user) {
      throw new Error(`Usuário não encontrado: ${userEmail}`);
    }

    console.log(`[Instance Binding] 👤 Usuário encontrado:`, user);

    // 3. Buscar instância pelo filtro de telefone
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .ilike('phone', `%${phoneFilter}%`)
      .eq('connection_type', 'web')
      .single();

    if (instanceError || !instance) {
      throw new Error(`Instância não encontrada com telefone contendo: ${phoneFilter}`);
    }

    console.log(`[Instance Binding] 📱 Instância encontrada:`, instance.id);

    // 4. Atualizar company_id da instância
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        company_id: user.company_id,
        instance_name: `${user.full_name.toLowerCase().replace(/\s+/g, '_')}_whatsapp`,
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      throw new Error(`Erro ao vincular instância: ${updateError.message}`);
    }

    console.log(`[Instance Binding] ✅ Vinculação concluída [${bindingId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        bindingId,
        instance: {
          id: instance.id,
          phone: instance.phone,
          newName: `${user.full_name.toLowerCase().replace(/\s+/g, '_')}_whatsapp`
        },
        user: {
          id: user.id,
          name: user.full_name,
          company: user.companies?.name
        },
        message: 'Instância vinculada com sucesso',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Binding] ❌ Erro na vinculação [${bindingId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        bindingId,
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

// CORREÇÃO: Função para vincular instância órfã por VPS instance ID
export async function bindOrphanInstanceById(supabase: any, instanceId: string, userEmail: string) {
  const bindingId = `bind_orphan_${Date.now()}`;
  console.log(`[Orphan Instance Binding] 🔗 Vinculando órfã por VPS ID [${bindingId}]:`, { instanceId, userEmail });
  
  try {
    // 1. Validar parâmetros
    if (!instanceId || !userEmail) {
      throw new Error('ID da instância e email são obrigatórios');
    }

    // 2. Buscar usuário pelo email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userEmail);
    
    if (authError || !authUser.user) {
      throw new Error(`Usuário não encontrado no auth: ${userEmail}`);
    }

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, company_id, companies!profiles_company_id_fkey(name)')
      .eq('id', authUser.user.id)
      .single();

    if (userError || !user) {
      throw new Error(`Perfil do usuário não encontrado: ${userEmail}`);
    }

    console.log(`[Orphan Instance Binding] 👤 Usuário encontrado:`, user);

    // 3. CORREÇÃO: Buscar instância por vps_instance_id OU por instance_name contendo o ID
    let instance = null;
    let instanceError = null;

    // Primeiro tenta por vps_instance_id
    const { data: instanceByVps, error: vpsError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('vps_instance_id', instanceId)
      .maybeSingle();

    if (!vpsError && instanceByVps) {
      instance = instanceByVps;
    } else {
      // Se não encontrou, tenta por instance_name ou phone contendo o ID
      const { data: instanceByName, error: nameError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .or(`instance_name.ilike.%${instanceId}%,phone.ilike.%${instanceId}%`)
        .eq('connection_type', 'web')
        .maybeSingle();

      if (!nameError && instanceByName) {
        instance = instanceByName;
      } else {
        instanceError = nameError || vpsError;
      }
    }

    if (instanceError || !instance) {
      throw new Error(`Instância órfã não encontrada com ID: ${instanceId}`);
    }

    console.log(`[Orphan Instance Binding] 📱 Instância órfã encontrada:`, instance.id);

    // 4. Atualizar company_id da instância órfã
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        company_id: user.company_id,
        instance_name: `${user.full_name.toLowerCase().replace(/\s+/g, '_')}_whatsapp`,
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    if (updateError) {
      throw new Error(`Erro ao vincular instância órfã: ${updateError.message}`);
    }

    console.log(`[Orphan Instance Binding] ✅ Vinculação de órfã concluída [${bindingId}]`);

    return new Response(
      JSON.stringify({
        success: true,
        bindingId,
        instance: {
          id: instance.id,
          vps_instance_id: instance.vps_instance_id,
          phone: instance.phone,
          newName: `${user.full_name.toLowerCase().replace(/\s+/g, '_')}_whatsapp`
        },
        user: {
          id: user.id,
          name: user.full_name,
          company: user.companies?.name
        },
        message: 'Instância órfã vinculada com sucesso',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Orphan Instance Binding] ❌ Erro na vinculação órfã [${bindingId}]:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        bindingId,
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
