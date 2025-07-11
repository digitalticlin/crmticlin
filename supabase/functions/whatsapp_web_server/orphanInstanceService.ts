
import { VPS_CONFIG } from './config.ts';
import { generateSequentialInstanceName, extractUsernameFromEmail } from './instanceNaming.ts';

// Função para adotar instância órfã ativa com nome de usuário apropriado
export async function adoptOrphanInstance(supabase: any, vpsInstance: any, companyId: string) {
  try {
    console.log(`[Adopt] 🆕 Adotando instância órfã ativa: ${vpsInstance.instanceId}`);
    
    // Buscar dados do usuário da empresa para gerar nome apropriado
    const { data: companyUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)
      .eq('role', 'admin')
      .limit(1);

    if (usersError || !companyUsers || companyUsers.length === 0) {
      console.error(`[Adopt] ❌ Erro ao buscar usuários da empresa:`, usersError);
      throw new Error('Não foi possível encontrar usuários da empresa');
    }

    // Buscar o email do usuário admin da empresa
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(companyUsers[0].id);
    
    if (userError || !userData.user) {
      console.error(`[Adopt] ❌ Erro ao buscar dados do usuário:`, userError);
      throw new Error('Não foi possível obter dados do usuário');
    }

    const userEmail = userData.user.email;
    const username = extractUsernameFromEmail(userEmail);
    console.log(`[Adopt] 👤 Username extraído: ${username} do email: ${userEmail}`);

    // Buscar instâncias existentes para gerar nome sequencial
    const { data: existingInstances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('company_id', companyId);

    if (instancesError) {
      console.error(`[Adopt] ❌ Erro ao buscar instâncias existentes:`, instancesError);
      throw new Error('Erro ao verificar instâncias existentes');
    }

    const existingNames = existingInstances?.map(i => i.instance_name) || [];
    const instanceName = generateSequentialInstanceName(username, existingNames);
    console.log(`[Adopt] 📝 Nome da instância gerado: ${instanceName}`);

    // Mapear status correto baseado no status VPS
    let connectionStatus = 'disconnected';
    let webStatus = 'disconnected';
    
    if (vpsInstance.status === 'open') {
      connectionStatus = 'open';
      webStatus = 'ready';
    } else if (vpsInstance.status === 'authenticated') {
      connectionStatus = 'authenticated';
      webStatus = 'authenticated';
    } else if (vpsInstance.status === 'ready') {
      connectionStatus = 'open';
      webStatus = 'ready';
    }

    console.log(`[Adopt] 🔄 Status mapeado: VPS(${vpsInstance.status}) -> connection(${connectionStatus}), web(${webStatus})`);

    // Criar registro no Supabase para a instância órfã ativa
    const adoptedInstance = {
      instance_name: instanceName,
      vps_instance_id: vpsInstance.instanceId,
      connection_type: 'web',
      connection_status: connectionStatus,
      web_status: webStatus,
      phone: vpsInstance.phone || '',
      profile_name: vpsInstance.profileName || null,
      server_url: VPS_CONFIG.baseUrl,
      company_id: companyId,
      date_connected: connectionStatus === 'open' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`[Adopt] 💾 Dados da instância adotada:`, adoptedInstance);

    const { data: newInstance, error } = await supabase
      .from('whatsapp_instances')
      .insert(adoptedInstance)
      .select()
      .single();

    if (error) {
      console.error(`[Adopt] ❌ Erro ao adotar instância órfã:`, error);
      throw error;
    }

    console.log(`[Adopt] ✅ Instância órfã adotada com sucesso:`, {
      id: newInstance.id,
      instance_name: newInstance.instance_name,
      vps_instance_id: newInstance.vps_instance_id,
      connection_status: newInstance.connection_status,
      web_status: newInstance.web_status,
      phone: newInstance.phone
    });

    return {
      action: 'adopted',
      instanceId: newInstance.id,
      vps_instance_id: vpsInstance.instanceId,
      instance_name: instanceName,
      connection_status: connectionStatus,
      web_status: webStatus,
      phone: vpsInstance.phone || null
    };

  } catch (error) {
    console.error(`[Adopt] ❌ Erro ao processar adoção da instância órfã:`, error);
    return {
      action: 'adoption_failed',
      instanceId: vpsInstance.instanceId,
      error: error.message
    };
  }
}

// Função para verificar se uma instância VPS está ativa/conectada
export function isActiveVPSInstance(vpsInstance: any): boolean {
  const activeStatuses = ['open', 'authenticated', 'ready'];
  return activeStatuses.includes(vpsInstance.status);
}

// NOVA FUNÇÃO: Excluir instâncias órfãs desconectadas do banco
export async function deleteOrphanedDisconnectedInstances(supabase: any, dbInstances: any[], vpsInstances: any[]) {
  console.log(`[Cleanup] 🧹 Iniciando limpeza de instâncias órfãs desconectadas`);
  
  const deletedInstances = [];
  const DISCONNECTED_THRESHOLD_HOURS = 24; // 24 horas sem aparecer no VPS
  
  for (const dbInstance of dbInstances) {
    // Verificar se a instância do banco não existe no VPS
    const existsInVPS = vpsInstances.some(vps => vps.instanceId === dbInstance.vps_instance_id);
    
    if (!existsInVPS) {
      // Verificar se está desconectada há mais de X horas
      const lastUpdate = new Date(dbInstance.updated_at || dbInstance.created_at);
      const hoursDisconnected = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      // Verificar se está realmente desconectada (não apenas ausente temporariamente)
      const isDisconnected = ['disconnected', 'closed', 'error'].includes(dbInstance.connection_status);
      
      if (hoursDisconnected > DISCONNECTED_THRESHOLD_HOURS && isDisconnected) {
        try {
          console.log(`[Cleanup] 🗑️ Excluindo instância órfã desconectada: ${dbInstance.instance_name} (órfã há ${Math.round(hoursDisconnected)}h)`);
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .delete()
            .eq('id', dbInstance.id);
          
          if (error) {
            console.error(`[Cleanup] ❌ Erro ao excluir instância ${dbInstance.instance_name}:`, error);
            deletedInstances.push({
              action: 'delete_failed',
              instanceId: dbInstance.id,
              instance_name: dbInstance.instance_name,
              error: error.message
            });
          } else {
            console.log(`[Cleanup] ✅ Instância órfã excluída: ${dbInstance.instance_name}`);
            deletedInstances.push({
              action: 'deleted',
              instanceId: dbInstance.id,
              instance_name: dbInstance.instance_name,
              hours_disconnected: Math.round(hoursDisconnected)
            });
          }
        } catch (error) {
          console.error(`[Cleanup] ❌ Erro ao processar exclusão de ${dbInstance.instance_name}:`, error);
          deletedInstances.push({
            action: 'delete_error',
            instanceId: dbInstance.id,
            instance_name: dbInstance.instance_name,
            error: error.message
          });
        }
      } else {
        console.log(`[Cleanup] ⏳ Instância órfã ainda dentro do prazo: ${dbInstance.instance_name} (órfã há ${Math.round(hoursDisconnected)}h, status: ${dbInstance.connection_status})`);
      }
    }
  }
  
  console.log(`[Cleanup] 🏁 Limpeza finalizada: ${deletedInstances.filter(d => d.action === 'deleted').length} instâncias excluídas`);
  return deletedInstances;
}
