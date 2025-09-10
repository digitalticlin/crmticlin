// SISTEMA DE RECUPERAÇÃO AUTOMÁTICA DE INSTÂNCIAS
// Para ser adicionado ao server.js da VPS

// Endpoint para recuperação automática das instâncias
app.post('/auto-recovery', authenticateToken, async (req, res) => {
  const logPrefix = '[Auto Recovery]';
  console.log(`${logPrefix} 🔄 Iniciando recuperação automática...`);

  try {
    const recoveryReport = {
      timestamp: new Date().toISOString(),
      databaseInstances: 0,
      vpsInstances: 0,
      recovered: 0,
      deleted: 0,
      errors: [],
      details: []
    };

    // 1. BUSCAR INSTÂNCIAS DO BANCO DE DADOS
    console.log(`${logPrefix} 📊 Consultando banco de dados Supabase...`);
    
    const supabaseResponse = await fetch('https://rhjgagzstjzynvrakdyj.supabase.co/rest/v1/whatsapp_instances?select=id,instance_name,vps_instance_id,phone,connection_status,created_by_user_id', {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Erro ao consultar banco: ${supabaseResponse.status}`);
    }

    const databaseInstances = await supabaseResponse.json();
    recoveryReport.databaseInstances = databaseInstances.length;
    
    console.log(`${logPrefix} 📋 Encontradas ${databaseInstances.length} instâncias no banco`);

    // 2. MAPEAR INSTÂNCIAS VÁLIDAS DO BANCO
    const validInstanceIds = new Set(databaseInstances.map(inst => inst.vps_instance_id).filter(Boolean));
    console.log(`${logPrefix} ✅ Instâncias válidas: ${Array.from(validInstanceIds).join(', ')}`);

    // 3. VERIFICAR INSTÂNCIAS ATUAIS NA VPS
    const currentVpsInstances = Object.keys(instances);
    recoveryReport.vpsInstances = currentVpsInstances.length;
    
    console.log(`${logPrefix} 📱 Instâncias atuais na VPS: ${currentVpsInstances.join(', ')}`);

    // 4. DELETAR INSTÂNCIAS ÓRFÃS (que não estão no banco)
    for (const vpsInstanceId of currentVpsInstances) {
      if (!validInstanceIds.has(vpsInstanceId)) {
        try {
          console.log(`${logPrefix} 🗑️ Deletando instância órfã: ${vpsInstanceId}`);
          await connectionManager.deleteInstance(vpsInstanceId);
          recoveryReport.deleted++;
          recoveryReport.details.push(`Deletada órfã: ${vpsInstanceId}`);
        } catch (deleteError) {
          const errorMsg = `Erro ao deletar ${vpsInstanceId}: ${deleteError.message}`;
          console.error(`${logPrefix} ❌ ${errorMsg}`);
          recoveryReport.errors.push(errorMsg);
        }
      }
    }

    // 5. RECRIAR/RECUPERAR INSTÂNCIAS DO BANCO
    for (const dbInstance of databaseInstances) {
      const { vps_instance_id: instanceId, created_by_user_id: userId } = dbInstance;
      
      if (!instanceId) {
        const errorMsg = `Instância ${dbInstance.instance_name} sem vps_instance_id`;
        console.warn(`${logPrefix} ⚠️ ${errorMsg}`);
        recoveryReport.errors.push(errorMsg);
        continue;
      }

      try {
        // Verificar se já existe na VPS
        if (instances[instanceId]) {
          console.log(`${logPrefix} 🔄 Instância ${instanceId} já existe, verificando status...`);
          
          const currentInstance = instances[instanceId];
          if (!currentInstance.connected && currentInstance.status !== 'connecting') {
            console.log(`${logPrefix} 🔧 Reconectando instância ${instanceId}...`);
            await connectionManager.createInstance(instanceId, userId, true); // Recovery mode
            recoveryReport.recovered++;
            recoveryReport.details.push(`Reconectada: ${instanceId}`);
          } else {
            recoveryReport.details.push(`Já ativa: ${instanceId} (${currentInstance.status})`);
          }
        } else {
          // Criar nova instância
          console.log(`${logPrefix} 🆕 Criando nova instância: ${instanceId}`);
          await connectionManager.createInstance(instanceId, userId);
          recoveryReport.recovered++;
          recoveryReport.details.push(`Criada: ${instanceId}`);
        }

      } catch (recoveryError) {
        const errorMsg = `Erro ao recuperar ${instanceId}: ${recoveryError.message}`;
        console.error(`${logPrefix} ❌ ${errorMsg}`);
        recoveryReport.errors.push(errorMsg);
      }
    }

    console.log(`${logPrefix} ✅ Recuperação concluída:`, {
      recovered: recoveryReport.recovered,
      deleted: recoveryReport.deleted,
      errors: recoveryReport.errors.length
    });

    res.json({
      success: true,
      message: 'Recuperação automática concluída',
      report: recoveryReport
    });

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro na recuperação automática:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro na recuperação automática',
      message: error.message
    });
  }
});

// Função para executar recuperação automática na inicialização
async function executeAutoRecoveryOnStartup() {
  const logPrefix = '[Startup Recovery]';
  console.log(`${logPrefix} 🚀 Executando recuperação automática na inicialização...`);
  
  // Aguardar 10 segundos para o servidor estar totalmente carregado
  setTimeout(async () => {
    try {
      console.log(`${logPrefix} 📡 Fazendo auto-recovery interno...`);
      
      // Simular requisição interna para auto-recovery
      const req = {
        headers: { 'authorization': `Bearer ${VPS_AUTH_TOKEN}` }
      };
      
      const res = {
        json: (data) => console.log(`${logPrefix} 📊 Resultado:`, data),
        status: (code) => ({ json: (data) => console.log(`${logPrefix} ❌ Erro ${code}:`, data) })
      };

      // Executar recuperação
      await executeAutoRecovery(req, res);
      
    } catch (error) {
      console.error(`${logPrefix} ❌ Erro na recuperação de inicialização:`, error);
    }
  }, 10000);
}

// Função separada para reutilização
async function executeAutoRecovery(req, res) {
  // Mover toda a lógica do endpoint /auto-recovery para cá
  // ... (mesmo código do endpoint acima)
}

// ADICIONAR NO FINAL DO server.js:
// executeAutoRecoveryOnStartup(); 