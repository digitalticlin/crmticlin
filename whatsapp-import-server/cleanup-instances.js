const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 🧹 SCRIPT DE LIMPEZA DE INSTÂNCIAS WHATSAPP
// Mantém apenas instâncias com número conectado e remove as desconectadas

const SERVER_URL = 'http://localhost:3002';
const AUTH_DIR = path.join(__dirname, 'auth_info');

console.log('🧹 === INICIANDO LIMPEZA DE INSTÂNCIAS WHATSAPP ===');
console.log('📁 Diretório de autenticação:', AUTH_DIR);

async function obterStatusInstancias() {
  try {
    console.log('\n📊 Obtendo status atual das instâncias...');
    
    const response = await axios.get(`${SERVER_URL}/status`);
    const data = response.data;
    
    console.log(`📈 Status do servidor: ${data.status}`);
    console.log(`🔢 Total de instâncias ativas: ${data.activeInstances}`);
    
    if (data.instances && data.instances.length > 0) {
      console.log('\n📋 Instâncias encontradas:');
      data.instances.forEach((inst, index) => {
        const status = inst.connected ? '✅ CONECTADA' : '❌ DESCONECTADA';
        const phone = inst.phone ? `(${inst.phone})` : '(sem número)';
        console.log(`  ${index + 1}. ${inst.instanceId} ${status} ${phone}`);
      });
    }
    
    return data.instances || [];
    
  } catch (error) {
    console.error('❌ Erro ao obter status das instâncias:', error.message);
    return [];
  }
}

async function deletarInstancia(instanceId) {
  try {
    console.log(`🗑️ Deletando instância: ${instanceId}`);
    
    // Tentar método DELETE primeiro
    try {
      await axios.delete(`${SERVER_URL}/instance/${instanceId}`);
      console.log(`✅ Instância ${instanceId} deletada via DELETE`);
      return true;
    } catch (deleteError) {
      console.log(`⚠️ DELETE falhou, tentando POST...`);
    }
    
    // Tentar método POST como fallback
    try {
      await axios.post(`${SERVER_URL}/instance/delete`, { instanceId });
      console.log(`✅ Instância ${instanceId} deletada via POST`);
      return true;
    } catch (postError) {
      console.log(`❌ Falha ao deletar ${instanceId}:`, postError.message);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Erro geral ao deletar ${instanceId}:`, error.message);
    return false;
  }
}

async function listarDiretoriosAuth() {
  try {
    console.log('\n📁 === ANÁLISE DOS DIRETÓRIOS DE AUTENTICAÇÃO ===');
    
    if (!fs.existsSync(AUTH_DIR)) {
      console.log('❌ Diretório auth_info não encontrado');
      return [];
    }
    
    const diretorios = fs.readdirSync(AUTH_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`📊 Total de diretórios de autenticação: ${diretorios.length}`);
    
    // Analisar cada diretório
    const analise = [];
    for (const dir of diretorios) {
      const dirPath = path.join(AUTH_DIR, dir);
      const arquivos = fs.readdirSync(dirPath);
      
      const info = {
        nome: dir,
        arquivos: arquivos.length,
        temCredentials: arquivos.includes('creds.json'),
        temKeys: arquivos.some(f => f.startsWith('keys-')),
        tamanhoTotal: 0
      };
      
      // Calcular tamanho total
      for (const arquivo of arquivos) {
        const filePath = path.join(dirPath, arquivo);
        const stats = fs.statSync(filePath);
        info.tamanhoTotal += stats.size;
      }
      
      analise.push(info);
    }
    
    // Mostrar estatísticas
    console.log('\n📈 Estatísticas dos diretórios:');
    console.log(`   📁 Total: ${analise.length}`);
    console.log(`   🔑 Com credentials: ${analise.filter(a => a.temCredentials).length}`);
    console.log(`   🗝️ Com keys: ${analise.filter(a => a.temKeys).length}`);
    
    // Mostrar primeiros 10 diretórios
    console.log('\n📋 Primeiros 10 diretórios:');
    analise.slice(0, 10).forEach((info, index) => {
      const creds = info.temCredentials ? '✅' : '❌';
      const keys = info.temKeys ? '✅' : '❌';
      const tamanho = (info.tamanhoTotal / 1024).toFixed(1);
      console.log(`  ${index + 1}. ${info.nome} | Creds: ${creds} | Keys: ${keys} | ${tamanho}KB`);
    });
    
    return analise;
    
  } catch (error) {
    console.error('❌ Erro ao analisar diretórios:', error.message);
    return [];
  }
}

async function removerDiretoriosOrfaos(instanciasAtivas, diretoriosAuth) {
  try {
    console.log('\n🧹 === LIMPEZA DE DIRETÓRIOS ÓRFÃOS ===');
    
    const nomesDiretorios = diretoriosAuth.map(d => d.nome);
    const nomesInstancias = instanciasAtivas.map(i => i.instanceId);
    
    // Encontrar diretórios órfãos (sem instância ativa)
    const diretoriosOrfaos = nomesDiretorios.filter(dir => 
      !nomesInstancias.includes(dir)
    );
    
    console.log(`📊 Diretórios órfãos encontrados: ${diretoriosOrfaos.length}`);
    
    if (diretoriosOrfaos.length === 0) {
      console.log('✅ Nenhum diretório órfão encontrado');
      return;
    }
    
    console.log('\n📋 Diretórios que serão removidos:');
    diretoriosOrfaos.forEach((dir, index) => {
      console.log(`  ${index + 1}. ${dir}`);
    });
    
    // Remover diretórios órfãos
    let removidos = 0;
    for (const dir of diretoriosOrfaos) {
      try {
        const dirPath = path.join(AUTH_DIR, dir);
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`🗑️ Removido: ${dir}`);
        removidos++;
      } catch (error) {
        console.error(`❌ Erro ao remover ${dir}:`, error.message);
      }
    }
    
    console.log(`\n✅ Limpeza concluída: ${removidos}/${diretoriosOrfaos.length} diretórios removidos`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza de diretórios:', error.message);
  }
}

async function executarLimpeza() {
  try {
    console.log('🚀 Iniciando processo de limpeza...');
    
    // 1. Obter status atual
    const instancias = await obterStatusInstancias();
    
    if (instancias.length === 0) {
      console.log('ℹ️ Nenhuma instância encontrada no servidor');
      return;
    }
    
    // 2. Separar conectadas e desconectadas
    const conectadas = instancias.filter(i => i.connected && i.phone);
    const desconectadas = instancias.filter(i => !i.connected || !i.phone);
    
    console.log(`\n📊 === RESUMO ===`);
    console.log(`✅ Instâncias conectadas (manter): ${conectadas.length}`);
    console.log(`❌ Instâncias desconectadas (remover): ${desconectadas.length}`);
    
    if (conectadas.length > 0) {
      console.log('\n✅ Instâncias que serão MANTIDAS:');
      conectadas.forEach((inst, index) => {
        console.log(`  ${index + 1}. ${inst.instanceId} (${inst.phone})`);
      });
    }
    
    if (desconectadas.length > 0) {
      console.log('\n❌ Instâncias que serão REMOVIDAS:');
      desconectadas.forEach((inst, index) => {
        console.log(`  ${index + 1}. ${inst.instanceId} (${inst.status})`);
      });
      
      // 3. Deletar instâncias desconectadas
      console.log('\n🗑️ Iniciando remoção das instâncias desconectadas...');
      
      let removidas = 0;
      for (const inst of desconectadas) {
        const sucesso = await deletarInstancia(inst.instanceId);
        if (sucesso) removidas++;
        
        // Aguardar um pouco entre as remoções
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`\n📊 Remoção concluída: ${removidas}/${desconectadas.length} instâncias removidas`);
    }
    
    // 4. Analisar diretórios de autenticação
    const diretoriosAuth = await listarDiretoriosAuth();
    
    // 5. Remover diretórios órfãos
    await removerDiretoriosOrfaos(conectadas, diretoriosAuth);
    
    // 6. Status final
    console.log('\n🎉 === LIMPEZA CONCLUÍDA ===');
    console.log(`✅ Instâncias mantidas: ${conectadas.length}`);
    console.log(`🗑️ Instâncias removidas: ${desconectadas.length}`);
    console.log(`📁 Diretórios de auth analisados: ${diretoriosAuth.length}`);
    
    // Verificar status final
    setTimeout(async () => {
      console.log('\n🔍 Verificando status final...');
      const instanciasFinal = await obterStatusInstancias();
      console.log(`📊 Instâncias restantes: ${instanciasFinal.length}`);
      
      if (instanciasFinal.length > 0) {
        console.log('✅ Instâncias ativas:');
        instanciasFinal.forEach((inst, index) => {
          const status = inst.connected ? '✅ CONECTADA' : '❌ DESCONECTADA';
          const phone = inst.phone ? `(${inst.phone})` : '(sem número)';
          console.log(`  ${index + 1}. ${inst.instanceId} ${status} ${phone}`);
        });
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  }
}

// Executar limpeza
executarLimpeza(); 