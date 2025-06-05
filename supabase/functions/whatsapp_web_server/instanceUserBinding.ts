
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
