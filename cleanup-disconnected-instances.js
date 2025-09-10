const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧹 Limpeza de Instâncias Desconectadas - VPS WhatsApp');
console.log('=',"=".repeat(50));

// Instâncias desconectadas identificadas para remoção
const DISCONNECTED_INSTANCES = [
  'admgeuniformes',
  'contatoluizantoniooliveira1', 
  'contatoluizantoniooliveira2',
  'contatoluizantoniooliveira3',
  'contatoluizantoniooliveira4',
  'digitalticlin2'
];

// Instâncias conectadas que devem ser PRESERVADAS
const CONNECTED_INSTANCES = [
  'contatoluizantoniooliveira',
  'digitalticlin',
  'eneas', 
  'imperioesportegyn',
  'mauroticlin'
];

const AUTH_DIR = '/root/whatsapp-server/auth_info';
const API_URL = 'http://localhost:3001';
const API_TOKEN = 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1';

async function verifyInstances() {
  console.log('🔍 Verificando status atual das instâncias...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/instances',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.instances);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function deleteInstance(instanceId) {
  console.log(`🗑️  Excluindo instância: ${instanceId}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/instances/${instanceId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   API Response: ${res.statusCode}`);
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log(`   ⚠️  Erro API para ${instanceId}:`, err.message);
      resolve({ error: err.message });
    });

    req.end();
  });
}

function removeAuthDir(instanceId) {
  const authPath = path.join(AUTH_DIR, instanceId);
  
  if (fs.existsSync(authPath)) {
    console.log(`📁 Removendo diretório auth: ${authPath}`);
    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log(`   ✅ Diretório removido com sucesso`);
      return true;
    } catch (err) {
      console.log(`   ❌ Erro ao remover diretório:`, err.message);
      return false;
    }
  } else {
    console.log(`   ⚠️  Diretório auth não encontrado: ${authPath}`);
    return false;
  }
}

async function main() {
  try {
    // 1. Verificar status atual
    const instances = await verifyInstances();
    console.log(`📊 Total de instâncias: ${instances.length}`);
    
    const connected = instances.filter(i => i.connected);
    const disconnected = instances.filter(i => !i.connected);
    
    console.log(`✅ Conectadas: ${connected.length}`);
    console.log(`❌ Desconectadas: ${disconnected.length}`);
    
    // 2. Validar instâncias para remoção
    console.log('\n🎯 Instâncias marcadas para remoção:');
    for (const instanceId of DISCONNECTED_INSTANCES) {
      const instance = instances.find(i => i.instanceId === instanceId);
      if (instance) {
        const status = instance.connected ? '🟢 CONECTADA' : '🔴 DESCONECTADA';
        console.log(`   ${instanceId}: ${status}`);
        
        if (instance.connected) {
          console.log(`   ⚠️  ATENÇÃO: Esta instância está conectada! Pulando...`);
          continue;
        }
      } else {
        console.log(`   ${instanceId}: ❓ NÃO ENCONTRADA`);
      }
    }

    // 3. Confirmar instâncias conectadas que devem ser preservadas
    console.log('\n🛡️  Instâncias conectadas que serão PRESERVADAS:');
    for (const instanceId of CONNECTED_INSTANCES) {
      const instance = instances.find(i => i.instanceId === instanceId);
      if (instance && instance.connected) {
        console.log(`   ✅ ${instanceId}: CONECTADA - PRESERVADA`);
      } else {
        console.log(`   ⚠️  ${instanceId}: DESCONECTADA ou NÃO ENCONTRADA`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🚀 INICIANDO LIMPEZA DAS INSTÂNCIAS DESCONECTADAS...');
    console.log('='.repeat(60));

    let removedCount = 0;
    let errorCount = 0;

    // 4. Processar cada instância desconectada
    for (const instanceId of DISCONNECTED_INSTANCES) {
      const instance = instances.find(i => i.instanceId === instanceId);
      
      // Pular instâncias conectadas por segurança
      if (instance && instance.connected) {
        console.log(`⏭️  PULANDO ${instanceId}: Instância está conectada`);
        continue;
      }

      console.log(`\n🔄 Processando: ${instanceId}`);
      
      // Excluir via API
      const apiResult = await deleteInstance(instanceId);
      if (apiResult.statusCode === 200 || apiResult.statusCode === 404) {
        console.log(`   ✅ API: Instância removida ou não encontrada`);
      } else {
        console.log(`   ⚠️  API: Status ${apiResult.statusCode}`);
      }

      // Remover diretório de autenticação
      const authRemoved = removeAuthDir(instanceId);
      
      if (authRemoved) {
        removedCount++;
        console.log(`   ✅ ${instanceId}: COMPLETAMENTE REMOVIDA`);
      } else {
        errorCount++;
        console.log(`   ❌ ${instanceId}: ERRO NA REMOÇÃO`);
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DA LIMPEZA');
    console.log('='.repeat(60));
    console.log(`✅ Instâncias removidas: ${removedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`🛡️  Instâncias preservadas: ${CONNECTED_INSTANCES.length}`);
    
    if (removedCount > 0) {
      console.log('\n🔄 RECOMENDAÇÃO: Reinicie o servidor para aplicar mudanças:');
      console.log('   pm2 restart whatsapp-server');
    }

    console.log('\n✅ Limpeza concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  }
}

main(); 