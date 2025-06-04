
import { corsHeaders } from './config.ts';

// Função para vincular instância específica ao usuário correto
export async function bindInstanceToUser(supabase: any, phoneFilter: string, userEmail: string) {
  const bindingId = `binding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[Instance User Binding] 🔗 INICIANDO vinculação [${bindingId}] para telefone: ${phoneFilter} -> usuário: ${userEmail}`);
    
    // 1. Buscar o usuário pelo email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(userEmail);
    
    if (authError || !authUser.user) {
      throw new Error(`Usuário '${userEmail}' não encontrado: ${authError?.message}`);
    }

    // 2. Buscar o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        company_id,
        companies:company_id (
          id,
          name
        )
      `)
      .eq('id', authUser.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Perfil do usuário '${userEmail}' não encontrado: ${profileError?.message}`);
    }

    console.log(`[Instance User Binding] 👤 Usuário encontrado: ${profile.full_name} (Empresa: ${profile.companies?.name})`);

    // 3. Extrair username do email para nomeação
    const username = userEmail.split('@')[0];
    console.log(`[Instance User Binding] 📝 Username extraído: ${username}`);

    // 4. Buscar instâncias existentes do usuário para numeração sequencial
    const { data: existingInstances, error: existingError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('company_id', profile.company_id);

    if (existingError) {
      console.error(`[Instance User Binding] ⚠️ Erro ao buscar instâncias existentes:`, existingError);
    }

    const existingNames = existingInstances?.map(i => i.instance_name) || [];
    
    // Gerar nome sequencial baseado no username
    const baseUsername = username.toLowerCase();
    const existingNumbers = existingNames
      .filter(name => name.startsWith(baseUsername))
      .map(name => {
        const match = name.match(new RegExp(`^${baseUsername}(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const intelligentInstanceName = `${baseUsername}${nextNumber}`;

    console.log(`[Instance User Binding] 🎯 Nome inteligente gerado: ${intelligentInstanceName}`);

    // 5. Buscar a instância na VPS pelo telefone
    const { data: vpsInstances, error: vpsError } = await supabase.functions.invoke('whatsapp_web_server', {
      body: { action: 'list_all_instances_global' }
    });

    if (vpsError || !vpsInstances.success) {
      throw new Error(`Erro ao buscar instâncias na VPS: ${vpsError?.message || vpsInstances.error}`);
    }

    const targetVpsInstance = vpsInstances.instances?.find((inst: any) => 
      inst.phone && inst.phone.includes(phoneFilter)
    );

    if (!targetVpsInstance) {
      throw new Error(`Instância com telefone contendo '${phoneFilter}' não encontrada na VPS`);
    }

    console.log(`[Instance User Binding] 📱 Instância VPS encontrada: ${targetVpsInstance.instanceId}`);

    // 6. Verificar se já existe no Supabase
    const { data: existingSupabaseInstance, error: checkError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_name, company_id')
      .eq('vps_instance_id', targetVpsInstance.instanceId)
      .maybeSingle();

    if (checkError) {
      console.error(`[Instance User Binding] ⚠️ Erro ao verificar instância existente:`, checkError);
    }

    let result;

    if (existingSupabaseInstance) {
      // Atualizar instância existente
      console.log(`[Instance User Binding] 🔄 Atualizando instância existente no Supabase`);
      
      const { data: updatedInstance, error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          instance_name: intelligentInstanceName,
          company_id: profile.company_id,
          phone: targetVpsInstance.phone || '',
          profile_name: targetVpsInstance.profileName,
          profile_pic_url: targetVpsInstance.profilePictureUrl,
          connection_status: targetVpsInstance.status,
          web_status: targetVpsInstance.status === 'open' ? 'ready' : 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSupabaseInstance.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Erro ao atualizar instância: ${updateError.message}`);
      }

      result = {
        action: 'updated',
        instance: updatedInstance,
        oldName: existingSupabaseInstance.instance_name,
        newName: intelligentInstanceName
      };

    } else {
      // Criar nova instância no Supabase
      console.log(`[Instance User Binding] ➕ Criando nova instância no Supabase`);
      
      const { data: newInstance, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: intelligentInstanceName,
          phone: targetVpsInstance.phone || '',
          company_id: profile.company_id,
          connection_type: 'web',
          server_url: 'http://31.97.24.222:3001',
          vps_instance_id: targetVpsInstance.instanceId,
          web_status: targetVpsInstance.status === 'open' ? 'ready' : 'disconnected',
          connection_status: targetVpsInstance.status || 'unknown',
          profile_name: targetVpsInstance.profileName,
          profile_pic_url: targetVpsInstance.profilePictureUrl
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erro ao criar instância: ${insertError.message}`);
      }

      result = {
        action: 'created',
        instance: newInstance,
        newName: intelligentInstanceName
      };
    }

    console.log(`[Instance User Binding] ✅ Vinculação concluída [${bindingId}]: ${result.action}`);

    return new Response(
      JSON.stringify({
        success: true,
        bindingId,
        result,
        user: {
          email: userEmail,
          name: profile.full_name,
          company: profile.companies?.name
        },
        instanceName: intelligentInstanceName,
        message: `Instância vinculada com sucesso ao usuário ${profile.full_name} (${profile.companies?.name})`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance User Binding] ❌ ERRO GERAL [${bindingId}]:`, error);
    
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
