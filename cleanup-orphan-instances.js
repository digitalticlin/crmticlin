// 🧹 LIMPEZA AUTOMÁTICA DE INSTÂNCIAS ÓRFÃS
// Este script remove instâncias que não deveriam existir na VPS

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class InstanceCleanup {
  constructor() {
    this.vpsUrl = 'http://localhost:3001';
    this.supabaseUrl = 'https://rhjgagzstjzynvrakdyj.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM';
    this.authDir = '/root/whatsapp-server/auth_info';
  }

  // 1. BUSCAR INSTÂNCIAS DO BANCO DE DADOS
  async getDatabaseInstances() {
    try {
      console.log('📊 Buscando instâncias válidas no banco de dados...');
      
      const response = await axios.get(
        `${this.supabaseUrl}/rest/v1/whatsapp_instances?select=id,instance_name,vps_instance_id,phone,connection_status`,
        {
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'apikey': this.supabaseKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const instances = response.data;
      console.log(`✅ Encontradas ${instances.length} instâncias no banco`);
      
      instances.forEach(inst => {
        console.log(`   • ${inst.vps_instance_id} (${inst.connection_status}) - Telefone: ${inst.phone || 'N/A'}`);
      });

      return instances.map(inst => inst.vps_instance_id).filter(Boolean);

    } catch (error) {
      console.error('❌ Erro ao buscar instâncias do banco:', error.message);
      return [];
    }
  }

  // 2. BUSCAR INSTÂNCIAS DA VPS
  async getVPSInstances() {
    try {
      console.log('🖥️ Buscando instâncias da VPS...');
      
      const response = await axios.get(`${this.vpsUrl}/status`);
      const instances = response.data.instances;
      
      console.log(`✅ Encontradas ${instances.length} instâncias na VPS`);
      
      instances.forEach(inst => {
        console.log(`   • ${inst.instanceId} (${inst.status}) - Conectada: ${inst.connected}`);
      });

      return instances;

    } catch (error) {
      console.error('❌ Erro ao buscar instâncias da VPS:', error.message);
      return [];
    }
  }

  // 3. VERIFICAR SE INSTÂNCIA TEM AUTENTICAÇÃO VÁLIDA
  hasValidAuth(instanceId) {
    const authPath = path.join(this.authDir, instanceId);
    
    if (!fs.existsSync(authPath)) {
      return false;
    }

    // Verificar se tem arquivos de autenticação essenciais
    const requiredFiles = ['creds.json'];
    const hasRequiredFiles = requiredFiles.every(file => 
      fs.existsSync(path.join(authPath, file))
    );

    if (!hasRequiredFiles) {
      return false;
    }

    // Verificar se o creds.json não está vazio/corrompido
    try {
      const credsPath = path.join(authPath, 'creds.json');
      const credsContent = fs.readFileSync(credsPath, 'utf8');
      const creds = JSON.parse(credsContent);
      
      // Verificar se tem dados essenciais
      return creds && (creds.me || creds.platform || Object.keys(creds).length > 2);
      
    } catch (error) {
      console.log(`   ⚠️ Arquivo creds.json corrompido para ${instanceId}`);
      return false;
    }
  }

  // 4. ANALISAR E IDENTIFICAR ÓRFÃS
  async analyzeInstances() {
    console.log('🔍 === ANÁLISE DE INSTÂNCIAS ÓRFÃS ===');
    
    const [dbInstances, vpsInstances] = await Promise.all([
      this.getDatabaseInstances(),
      this.getVPSInstances()
    ]);

    const analysis = {
      database: dbInstances,
      vps: vpsInstances,
      orphans: [],
      invalidAuth: [],
      toKeep: [],
      toDelete: []
    };

    console.log('\n🔍 Analisando cada instância da VPS...');
    
    for (const vpsInstance of vpsInstances) {
      const instanceId = vpsInstance.instanceId;
      const isInDatabase = dbInstances.includes(instanceId);
      const hasAuth = this.hasValidAuth(instanceId);
      const isConnected = vpsInstance.connected;

      console.log(`\n📋 Instância: ${instanceId}`);
      console.log(`   • No banco: ${isInDatabase ? '✅' : '❌'}`);
      console.log(`   • Auth válida: ${hasAuth ? '✅' : '❌'}`);
      console.log(`   • Conectada: ${isConnected ? '✅' : '❌'}`);
      console.log(`   • Status: ${vpsInstance.status}`);

      // CRITÉRIOS PARA MANTER OU DELETAR
      if (isInDatabase && hasAuth && isConnected) {
        // MANTER: Está no banco, tem auth e está conectada
        analysis.toKeep.push({
          instanceId,
          reason: 'Válida: no banco + auth + conectada'
        });
        console.log(`   ✅ MANTER: Instância válida e funcionando`);
        
      } else if (isInDatabase && hasAuth && !isConnected) {
        // MANTER: Está no banco e tem auth (pode reconectar)
        analysis.toKeep.push({
          instanceId,
          reason: 'Válida: no banco + auth (pode reconectar)'
        });
        console.log(`   ⚠️ MANTER: Pode reconectar`);
        
      } else {
        // DELETAR: Qualquer outro caso
        let reason = [];
        if (!isInDatabase) reason.push('não está no banco');
        if (!hasAuth) reason.push('sem auth válida');
        if (!isConnected) reason.push('não conectada');
        
        analysis.toDelete.push({
          instanceId,
          reason: `Órfã: ${reason.join(' + ')}`
        });
        console.log(`   ❌ DELETAR: ${reason.join(' + ')}`);
        
        if (!isInDatabase) analysis.orphans.push(instanceId);
        if (!hasAuth) analysis.invalidAuth.push(instanceId);
      }
    }

    return analysis;
  }

  // 5. EXECUTAR LIMPEZA
  async executeCleanup(dryRun = true) {
    const analysis = await this.analyzeInstances();
    
    console.log('\n🧹 === RESUMO DA LIMPEZA ===');
    console.log(`✅ Manter: ${analysis.toKeep.length} instâncias`);
    console.log(`❌ Deletar: ${analysis.toDelete.length} instâncias`);
    
    if (analysis.toKeep.length > 0) {
      console.log('\n✅ INSTÂNCIAS A MANTER:');
      analysis.toKeep.forEach(item => {
        console.log(`   • ${item.instanceId} - ${item.reason}`);
      });
    }
    
    if (analysis.toDelete.length > 0) {
      console.log('\n❌ INSTÂNCIAS A DELETAR:');
      analysis.toDelete.forEach(item => {
        console.log(`   • ${item.instanceId} - ${item.reason}`);
      });
    }

    if (dryRun) {
      console.log('\n🔍 MODO DRY RUN - Nenhuma ação executada');
      console.log('Execute com deleteOrphans(false) para aplicar as mudanças');
      return analysis;
    }

    // EXECUTAR DELEÇÕES REAIS
    console.log('\n🗑️ Executando deleções...');
    
    for (const item of analysis.toDelete) {
      try {
        console.log(`🗑️ Deletando ${item.instanceId}...`);
        
        // Deletar via API
        await axios.delete(`${this.vpsUrl}/instance/${item.instanceId}`);
        
        // Deletar diretório de auth
        const authPath = path.join(this.authDir, item.instanceId);
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true });
          console.log(`   📁 Diretório auth removido: ${authPath}`);
        }
        
        console.log(`   ✅ ${item.instanceId} deletada com sucesso`);
        
        // Delay entre deleções
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Erro ao deletar ${item.instanceId}:`, error.message);
      }
    }

    console.log('\n🎉 Limpeza concluída!');
    return analysis;
  }

  // 6. MÉTODO PRINCIPAL
  async deleteOrphans(dryRun = true) {
    console.log('🧹 === LIMPEZA AUTOMÁTICA DE INSTÂNCIAS ÓRFÃS ===');
    console.log(`Modo: ${dryRun ? 'DRY RUN (apenas análise)' : 'EXECUÇÃO REAL'}`);
    
    try {
      const result = await this.executeCleanup(dryRun);
      
      console.log('\n📊 ESTATÍSTICAS FINAIS:');
      console.log(`   • Instâncias no banco: ${result.database.length}`);
      console.log(`   • Instâncias na VPS: ${result.vps.length}`);
      console.log(`   • Órfãs (não no banco): ${result.orphans.length}`);
      console.log(`   • Auth inválida: ${result.invalidAuth.length}`);
      console.log(`   • Para manter: ${result.toKeep.length}`);
      console.log(`   • Para deletar: ${result.toDelete.length}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error.message);
      throw error;
    }
  }
}

// EXECUTAR SE CHAMADO DIRETAMENTE
if (require.main === module) {
  const cleanup = new InstanceCleanup();
  
  // Executar em modo DRY RUN primeiro
  cleanup.deleteOrphans(true)
    .then(() => {
      console.log('\n⚠️ Para executar a limpeza real, execute:');
      console.log('node cleanup-orphan-instances.js --execute');
    })
    .catch(console.error);
}

module.exports = InstanceCleanup; 