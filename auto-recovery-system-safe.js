// SISTEMA DE RECUPERAÇÃO AUTOMÁTICA COM PROTEÇÃO ANTI-LOOP
// Para ser adicionado ao server.js da VPS

// ✅ CONTROLES ANTI-LOOP
const recoveryControl = {
  isRunning: false,
  lastExecution: null,
  minInterval: 5 * 60 * 1000, // 5 minutos mínimo entre execuções
  instanceAttempts: new Map(), // Contador de tentativas por instância
  blacklist: new Map(), // Instâncias temporariamente bloqueadas
  maxAttemptsPerInstance: 3, // Máximo 3 tentativas por instância
  blacklistDuration: 30 * 60 * 1000, // 30 minutos na blacklist
  startupRecoveryDone: false
};

// Função para verificar se instância está na blacklist
function isInstanceBlacklisted(instanceId) {
  const blacklistEntry = recoveryControl.blacklist.get(instanceId);
  if (!blacklistEntry) return false;
  
  if (Date.now() > blacklistEntry.until) {
    recoveryControl.blacklist.delete(instanceId);
    return false;
  }
  
  return true;
}

// Função para adicionar instância à blacklist
function addToBlacklist(instanceId, reason) {
  recoveryControl.blacklist.set(instanceId, {
    reason,
    until: Date.now() + recoveryControl.blacklistDuration,
    attempts: recoveryControl.instanceAttempts.get(instanceId) || 0
  });
  console.log(`[Recovery Control] 🚫 Instância ${instanceId} adicionada à blacklist por ${recoveryControl.blacklistDuration/60000} min. Motivo: ${reason}`);
}

// Endpoint para recuperação automática das instâncias
app.post('/auto-recovery', authenticateToken, async (req, res) => {
  const logPrefix = '[Auto Recovery]';
  const requestTime = Date.now();
  
  // ✅ PROTEÇÃO 1: Verificar se já está executando
  if (recoveryControl.isRunning) {
    return res.status(429).json({
      success: false,
      error: 'Recuperação já em andamento',
      message: 'Aguarde a conclusão da recuperação atual'
    });
  }

  // ✅ PROTEÇÃO 2: Verificar intervalo mínimo
  if (recoveryControl.lastExecution && (requestTime - recoveryControl.lastExecution) < recoveryControl.minInterval) {
    const remainingTime = Math.ceil((recoveryControl.minInterval - (requestTime - recoveryControl.lastExecution)) / 1000);
    return res.status(429).json({
      success: false,
      error: 'Muito frequente',
      message: `Aguarde ${remainingTime} segundos antes de executar novamente`
    });
  }

  console.log(`${logPrefix} 🔄 Iniciando recuperação automática com proteções...`);
  recoveryControl.isRunning = true;
  recoveryControl.lastExecution = requestTime;

  try {
    const recoveryReport = {
      timestamp: new Date().toISOString(),
      databaseInstances: 0,
      vpsInstances: 0,
      recovered: 0,
      deleted: 0,
      skipped: 0,
      blacklisted: 0,
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
          
          // Limpar registros de controle da instância órfã
          recoveryControl.instanceAttempts.delete(vpsInstanceId);
          recoveryControl.blacklist.delete(vpsInstanceId);
          
        } catch (deleteError) {
          const errorMsg = `Erro ao deletar órfã ${vpsInstanceId}: ${deleteError.message}`;
          console.error(`${logPrefix} ❌ ${errorMsg}`);
          recoveryReport.errors.push(errorMsg);
        }
      }
    }

    // 5. RECRIAR/RECUPERAR INSTÂNCIAS DO BANCO COM PROTEÇÕES
    for (const dbInstance of databaseInstances) {
      const { vps_instance_id: instanceId, created_by_user_id: userId } = dbInstance;
      
      if (!instanceId) {
        const errorMsg = `Instância ${dbInstance.instance_name} sem vps_instance_id`;
        console.warn(`${logPrefix} ⚠️ ${errorMsg}`);
        recoveryReport.errors.push(errorMsg);
        continue;
      }

      // ✅ PROTEÇÃO 3: Verificar blacklist
      if (isInstanceBlacklisted(instanceId)) {
        const blacklistInfo = recoveryControl.blacklist.get(instanceId);
        console.log(`${logPrefix} 🚫 Instância ${instanceId} na blacklist (${blacklistInfo.reason})`);
        recoveryReport.blacklisted++;
        recoveryReport.details.push(`Blacklisted: ${instanceId} (${blacklistInfo.reason})`);
        continue;
      }

      try {
        // Verificar se já existe na VPS
        if (instances[instanceId]) {
          const currentInstance = instances[instanceId];
          
          // Só reconectar se estiver desconectada E não estiver tentando conectar
          if (!currentInstance.connected && currentInstance.status !== 'connecting' && currentInstance.status !== 'qr_ready') {
            // ✅ PROTEÇÃO 4: Verificar tentativas
            const attempts = recoveryControl.instanceAttempts.get(instanceId) || 0;
            
            if (attempts >= recoveryControl.maxAttemptsPerInstance) {
              addToBlacklist(instanceId, `Máximo de tentativas (${attempts})`);
              recoveryReport.blacklisted++;
              continue;
            }

            console.log(`${logPrefix} 🔧 Reconectando instância ${instanceId} (tentativa ${attempts + 1})...`);
            
            // Incrementar contador de tentativas
            recoveryControl.instanceAttempts.set(instanceId, attempts + 1);
            
            await connectionManager.createInstance(instanceId, userId, true); // Recovery mode
            recoveryReport.recovered++;
            recoveryReport.details.push(`Reconectada: ${instanceId} (tentativa ${attempts + 1})`);
            
          } else {
            // Instância está ativa ou conectando
            recoveryReport.details.push(`Já ativa: ${instanceId} (${currentInstance.status})`);
            
            // Se está conectada, resetar contador de tentativas
            if (currentInstance.connected) {
              recoveryControl.instanceAttempts.delete(instanceId);
            }
          }
        } else {
          // ✅ PROTEÇÃO 5: Verificar tentativas para criação nova
          const attempts = recoveryControl.instanceAttempts.get(instanceId) || 0;
          
          if (attempts >= recoveryControl.maxAttemptsPerInstance) {
            addToBlacklist(instanceId, `Falha na criação (${attempts} tentativas)`);
            recoveryReport.blacklisted++;
            continue;
          }

          console.log(`${logPrefix} 🆕 Criando nova instância: ${instanceId} (tentativa ${attempts + 1})`);
          
          // Incrementar contador de tentativas
          recoveryControl.instanceAttempts.set(instanceId, attempts + 1);
          
          await connectionManager.createInstance(instanceId, userId);
          recoveryReport.recovered++;
          recoveryReport.details.push(`Criada: ${instanceId} (tentativa ${attempts + 1})`);
        }

        // ✅ PROTEÇÃO 6: Delay entre criações para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (recoveryError) {
        const errorMsg = `Erro ao recuperar ${instanceId}: ${recoveryError.message}`;
        console.error(`${logPrefix} ❌ ${errorMsg}`);
        recoveryReport.errors.push(errorMsg);
        
        // Se erro repetido, adicionar à blacklist
        const attempts = recoveryControl.instanceAttempts.get(instanceId) || 0;
        if (attempts >= 2) {
          addToBlacklist(instanceId, `Erros repetidos: ${recoveryError.message}`);
          recoveryReport.blacklisted++;
        }
      }
    }

    console.log(`${logPrefix} ✅ Recuperação concluída:`, {
      recovered: recoveryReport.recovered,
      deleted: recoveryReport.deleted,
      blacklisted: recoveryReport.blacklisted,
      errors: recoveryReport.errors.length
    });

    res.json({
      success: true,
      message: 'Recuperação automática concluída com proteções',
      report: recoveryReport,
      control: {
        blacklistedInstances: Array.from(recoveryControl.blacklist.keys()),
        nextAllowedExecution: new Date(requestTime + recoveryControl.minInterval).toISOString()
      }
    });

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro na recuperação automática:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro na recuperação automática',
      message: error.message
    });
  } finally {
    // ✅ SEMPRE LIBERAR O LOCK
    recoveryControl.isRunning = false;
  }
});

// Endpoint para gerenciar blacklist
app.get('/recovery-status', authenticateToken, (req, res) => {
  const blacklistInfo = Array.from(recoveryControl.blacklist.entries()).map(([instanceId, info]) => ({
    instanceId,
    reason: info.reason,
    attempts: info.attempts,
    until: new Date(info.until).toISOString(),
    remainingMinutes: Math.ceil((info.until - Date.now()) / 60000)
  }));

  res.json({
    isRunning: recoveryControl.isRunning,
    lastExecution: recoveryControl.lastExecution ? new Date(recoveryControl.lastExecution).toISOString() : null,
    nextAllowed: recoveryControl.lastExecution ? new Date(recoveryControl.lastExecution + recoveryControl.minInterval).toISOString() : null,
    blacklistedInstances: blacklistInfo,
    instanceAttempts: Object.fromEntries(recoveryControl.instanceAttempts)
  });
});

// Endpoint para limpar blacklist (emergência)
app.post('/recovery-reset', authenticateToken, (req, res) => {
  recoveryControl.blacklist.clear();
  recoveryControl.instanceAttempts.clear();
  recoveryControl.isRunning = false;
  
  console.log('[Recovery Control] 🔄 Controles resetados manualmente');
  
  res.json({
    success: true,
    message: 'Controles de recuperação resetados'
  });
});

// ✅ FUNÇÃO PARA EXECUTAR RECUPERAÇÃO AUTOMÁTICA NA INICIALIZAÇÃO (UMA VEZ APENAS)
function executeAutoRecoveryOnStartup() {
  const logPrefix = '[Startup Recovery]';
  
  // ✅ PROTEÇÃO: Executar apenas uma vez por inicialização
  if (recoveryControl.startupRecoveryDone) {
    console.log(`${logPrefix} ⏭️ Recuperação de inicialização já executada`);
    return;
  }
  
  console.log(`${logPrefix} 🚀 Agendando recuperação automática na inicialização...`);
  
  // Aguardar 15 segundos para o servidor estar totalmente carregado
  setTimeout(async () => {
    try {
      // Marcar como executada ANTES de executar para evitar reexecução
      recoveryControl.startupRecoveryDone = true;
      
      console.log(`${logPrefix} 📡 Executando auto-recovery de inicialização...`);
      
      const response = await fetch('http://localhost:3001/auto-recovery', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`${logPrefix} ✅ Recuperação de inicialização concluída:`, {
          recovered: result.report?.recovered || 0,
          deleted: result.report?.deleted || 0,
          blacklisted: result.report?.blacklisted || 0
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error(`${logPrefix} ❌ Erro na recuperação de inicialização:`, error);
      // NÃO resetar o flag em caso de erro para evitar loops
    }
  }, 15000);
}

// ADICIONAR NO FINAL DO server.js:
// executeAutoRecoveryOnStartup(); 