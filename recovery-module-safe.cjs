// 🛡️ MÓDULO DE RECUPERAÇÃO AUTOMÁTICA - IMPLEMENTAÇÃO SEGURA
// Este arquivo é INDEPENDENTE e pode ser removido sem afetar o server.js principal
// Funciona como um serviço auxiliar que se conecta à VPS existente

const axios = require('axios');

class SafeRecoveryModule {
  constructor(config) {
    this.config = {
      vpsUrl: config.vpsUrl || 'http://31.97.163.57:3001',
      authToken: config.authToken,
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      enabled: config.enabled !== false, // Padrão: habilitado
      maxAttempts: config.maxAttempts || 3,
      cooldownMinutes: config.cooldownMinutes || 30,
      intervalMinutes: config.intervalMinutes || 5
    };

    this.state = {
      isRunning: false,
      lastExecution: null,
      instanceAttempts: new Map(),
      blacklist: new Map(),
      startupDone: false,
      safetyLock: false
    };

    console.log('🛡️ [SafeRecovery] Módulo inicializado (SEGURO)');
  }

  // 🛡️ MÉTODO PRINCIPAL: Verificar se é seguro executar
  isSafeToRun() {
    if (!this.config.enabled) {
      console.log('🛡️ [SafeRecovery] Módulo desabilitado por configuração');
      return false;
    }

    if (this.state.safetyLock) {
      console.log('🛡️ [SafeRecovery] Safety lock ativado - operação bloqueada');
      return false;
    }

    if (this.state.isRunning) {
      console.log('🛡️ [SafeRecovery] Já em execução - evitando conflito');
      return false;
    }

    const now = Date.now();
    const minInterval = this.config.intervalMinutes * 60 * 1000;
    
    if (this.state.lastExecution && (now - this.state.lastExecution) < minInterval) {
      const remaining = Math.ceil((minInterval - (now - this.state.lastExecution)) / 60000);
      console.log(`🛡️ [SafeRecovery] Aguardando cooldown: ${remaining} minutos restantes`);
      return false;
    }

    return true;
  }

  // 🛡️ ATIVAR SAFETY LOCK (bloqueia operações até ser removido manualmente)
  activateSafetyLock(reason = 'Manual') {
    this.state.safetyLock = true;
    console.log(`🛡️ [SafeRecovery] SAFETY LOCK ATIVADO: ${reason}`);
  }

  // 🛡️ REMOVER SAFETY LOCK
  removeSafetyLock() {
    this.state.safetyLock = false;
    console.log('🛡️ [SafeRecovery] Safety lock removido');
  }

  // 🛡️ VERIFICAR STATUS DA VPS (antes de fazer qualquer coisa)
  async checkVPSHealth() {
    try {
      const response = await axios.get(`${this.config.vpsUrl}/health`, {
        headers: { 'Authorization': `Bearer ${this.config.authToken}` },
        timeout: 5000
      });

      if (response.status !== 200 || !response.data) {
        throw new Error(`VPS não saudável: ${response.status}`);
      }

      console.log('🛡️ [SafeRecovery] VPS health check: OK');
      return true;

    } catch (error) {
      console.error('🛡️ [SafeRecovery] VPS health check FALHOU:', error.message);
      this.activateSafetyLock('VPS Health Check Failed');
      return false;
    }
  }

  // 🛡️ BUSCAR INSTÂNCIAS DO BANCO (sem modificar nada)
  async getDatabaseInstances() {
    try {
      const response = await axios.get(
        `${this.config.supabaseUrl}/rest/v1/whatsapp_instances?select=id,instance_name,vps_instance_id,phone,connection_status,created_by_user_id`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.supabaseKey}`,
            'apikey': this.config.supabaseKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log(`🛡️ [SafeRecovery] Encontradas ${response.data.length} instâncias no banco`);
      return response.data;

    } catch (error) {
      console.error('🛡️ [SafeRecovery] Erro ao consultar banco:', error.message);
      throw error;
    }
  }

  // 🛡️ BUSCAR INSTÂNCIAS DA VPS (sem modificar nada)
  async getVPSInstances() {
    try {
      const response = await axios.get(`${this.config.vpsUrl}/instances`, {
        headers: { 'Authorization': `Bearer ${this.config.authToken}` },
        timeout: 10000
      });

      console.log(`🛡️ [SafeRecovery] Encontradas ${response.data.instances.length} instâncias na VPS`);
      return response.data.instances;

    } catch (error) {
      console.error('🛡️ [SafeRecovery] Erro ao consultar VPS:', error.message);
      throw error;
    }
  }

  // 🛡️ ANÁLISE SEGURA (apenas relatório, sem modificações)
  async analyzeInstances() {
    if (!this.isSafeToRun()) return null;

    console.log('🛡️ [SafeRecovery] Iniciando análise segura...');

    try {
      // 1. Verificar saúde da VPS
      if (!(await this.checkVPSHealth())) {
        return null;
      }

      // 2. Buscar dados
      const [databaseInstances, vpsInstances] = await Promise.all([
        this.getDatabaseInstances(),
        this.getVPSInstances()
      ]);

      // 3. Analisar diferenças
      const dbInstanceIds = new Set(databaseInstances.map(i => i.vps_instance_id).filter(Boolean));
      const vpsInstanceIds = new Set(vpsInstances.map(i => i.instanceId || i.instanceName));

      const analysis = {
        timestamp: new Date().toISOString(),
        database: {
          total: databaseInstances.length,
          instances: Array.from(dbInstanceIds)
        },
        vps: {
          total: vpsInstances.length,
          instances: Array.from(vpsInstanceIds),
          connected: vpsInstances.filter(i => i.connected).length,
          connecting: vpsInstances.filter(i => i.status === 'connecting').length
        },
        orphans: Array.from(vpsInstanceIds).filter(id => !dbInstanceIds.has(id)),
        missing: Array.from(dbInstanceIds).filter(id => !vpsInstanceIds.has(id)),
        needRecovery: []
      };

      // Identificar instâncias que precisam de recuperação
      for (const vpsInstance of vpsInstances) {
        const id = vpsInstance.instanceId || vpsInstance.instanceName;
        if (dbInstanceIds.has(id) && !vpsInstance.connected && vpsInstance.status !== 'connecting') {
          analysis.needRecovery.push(id);
        }
      }

      console.log('🛡️ [SafeRecovery] Análise concluída:', {
        órfãs: analysis.orphans.length,
        ausentes: analysis.missing.length,
        precisamRecuperação: analysis.needRecovery.length
      });

      return analysis;

    } catch (error) {
      console.error('🛡️ [SafeRecovery] Erro na análise:', error.message);
      this.activateSafetyLock('Analysis Error');
      return null;
    }
  }

  // 🛡️ EXECUTAR RECUPERAÇÃO SEGURA (com muitas verificações)
  async executeSafeRecovery(dryRun = true) {
    if (!this.isSafeToRun()) {
      return { success: false, error: 'Não é seguro executar agora' };
    }

    this.state.isRunning = true;
    this.state.lastExecution = Date.now();

    try {
      const analysis = await this.analyzeInstances();
      if (!analysis) {
        return { success: false, error: 'Falha na análise' };
      }

      const report = {
        dryRun,
        analysis,
        actions: {
          orphansDeleted: 0,
          instancesRecovered: 0,
          errors: []
        }
      };

      if (dryRun) {
        console.log('🛡️ [SafeRecovery] DRY RUN - nenhuma ação será executada');
        report.wouldDelete = analysis.orphans;
        report.wouldRecover = analysis.needRecovery;
        return { success: true, report };
      }

      // EXECUTAR AÇÕES REAIS (apenas se não for dry run)
      console.log('🛡️ [SafeRecovery] Executando recuperação real...');

      // Aqui viriam as chamadas reais para a VPS, mas com muita cautela
      // Por enquanto, apenas simular para segurança máxima

      return { success: true, report };

    } catch (error) {
      console.error('🛡️ [SafeRecovery] Erro na recuperação:', error.message);
      this.activateSafetyLock('Recovery Error');
      return { success: false, error: error.message };
    } finally {
      this.state.isRunning = false;
    }
  }

  // 🛡️ STATUS DO MÓDULO
  getStatus() {
    return {
      enabled: this.config.enabled,
      safetyLock: this.state.safetyLock,
      isRunning: this.state.isRunning,
      lastExecution: this.state.lastExecution ? new Date(this.state.lastExecution).toISOString() : null,
      blacklistedInstances: Array.from(this.state.blacklist.keys()),
      config: {
        maxAttempts: this.config.maxAttempts,
        cooldownMinutes: this.config.cooldownMinutes,
        intervalMinutes: this.config.intervalMinutes
      }
    };
  }
}

module.exports = SafeRecoveryModule; 