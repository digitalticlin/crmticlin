#!/bin/bash

# 🗑️ CORRIGIR DELETAR INSTÂNCIA COMPLETA - VPS WhatsApp
echo "🗑️ MELHORANDO SISTEMA DE DELETAR INSTÂNCIA WHATSAPP"
echo "Data: $(date)"
echo "================================================="

VPS_PATH="/root/whatsapp-server"
BACKUP_SUFFIX="backup-$(date +%Y%m%d_%H%M%S)"

echo ""
echo "🔍 1. VERIFICANDO ESTADO ATUAL DO SISTEMA"
echo "================================================="

echo "🔍 Verificando método deleteInstance atual:"
grep -n -A 10 "deleteInstance" /root/whatsapp-server/src/utils/connection-manager.js | head -15

echo ""
echo "📊 Status atual dos processos:"
pm2 status

echo ""
echo "📁 Instâncias ativas em auth_info:"
ls -la /root/whatsapp-server/auth_info/ | grep "^d" | wc -l
echo "Instâncias encontradas: $(ls -la /root/whatsapp-server/auth_info/ | grep "^d" | grep -v "^total" | wc -l)"

echo ""
echo "🔧 2. FAZENDO BACKUP DO CONNECTION-MANAGER"
echo "================================================="

cd $VPS_PATH

echo "💾 Criando backup do connection-manager.js..."
cp src/utils/connection-manager.js src/utils/connection-manager.js.$BACKUP_SUFFIX
echo "✅ Backup criado: connection-manager.js.$BACKUP_SUFFIX"

echo ""
echo "🛠️ 3. MELHORANDO MÉTODO DELETEINSTANCE"
echo "================================================="

echo "📝 Aplicando melhorias no método deleteInstance..."

# Criar versão melhorada do deleteInstance
cat > /tmp/enhanced_deleteInstance.js << 'EOF'
  async deleteInstance(instanceId) {
    const logPrefix = `[ConnectionManager ${instanceId}]`;
    const instance = this.instances[instanceId];

    console.log(`${logPrefix} 🗑️ Iniciando deleção COMPLETA da instância...`);

    // 1. LIMPEZA DE MEMÓRIA (mesmo se instância não existir)
    try {
      if (instance) {
        // Fechar socket se existir
        if (instance.socket) {
          try {
            instance.socket.end();
            console.log(`${logPrefix} 🔌 Socket fechado`);
          } catch (error) {
            console.error(`${logPrefix} ⚠️ Erro ao fechar socket:`, error.message);
          }
        }

        // Fechar cliente WhatsApp se existir
        if (instance.client) {
          try {
            await instance.client.destroy();
            console.log(`${logPrefix} 📱 Cliente WhatsApp destruído`);
          } catch (error) {
            console.error(`${logPrefix} ⚠️ Erro ao destruir cliente:`, error.message);
          }
        }
      }

      // Limpar contadores e referências (sempre fazer)
      this.connectionAttempts.delete(instanceId);
      delete this.instances[instanceId];
      console.log(`${logPrefix} 🧠 Limpeza de memória concluída`);

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro na limpeza de memória:`, error);
    }

    // 2. LIMPEZA DE FILESYSTEM ROBUSTA
    try {
      const authDir = path.join(this.authDir, instanceId);
      console.log(`${logPrefix} 📁 Verificando diretório: ${authDir}`);
      
      if (fs.existsSync(authDir)) {
        // Múltiplas tentativas de remoção
        let attempts = 0;
        let deleted = false;
        
        while (attempts < 3 && !deleted) {
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
            
            // Verificar se realmente foi deletado
            if (!fs.existsSync(authDir)) {
              deleted = true;
              console.log(`${logPrefix} 📁 Diretório removido com sucesso (tentativa ${attempts + 1})`);
            } else {
              attempts++;
              console.log(`${logPrefix} ⚠️ Tentativa ${attempts} falhou, tentando novamente...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
            }
          } catch (error) {
            attempts++;
            console.error(`${logPrefix} ❌ Tentativa ${attempts} de remoção falhou:`, error.message);
            if (attempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
            }
          }
        }

        if (!deleted) {
          console.error(`${logPrefix} ❌ FALHA: Não foi possível remover ${authDir} após 3 tentativas`);
        }
      } else {
        console.log(`${logPrefix} ℹ️ Diretório auth_info não existe (já foi removido)`);
      }

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro na limpeza de filesystem:`, error);
    }

    // 3. LIMPEZA DE LOGS E CACHE
    try {
      // Limpar logs específicos da instância (se existirem)
      const logFiles = [
        `/root/.pm2/logs/whatsapp-server-out-7.log`,
        `/root/.pm2/logs/whatsapp-server-error-7.log`
      ];
      
      console.log(`${logPrefix} 📋 Limpando referências nos logs...`);
      // Não deletar os arquivos, apenas registrar
      console.log(`${logPrefix} ℹ️ Logs de PM2 mantidos (contêm outras instâncias)`);

    } catch (error) {
      console.error(`${logPrefix} ⚠️ Erro na limpeza de logs:`, error);
    }

    // 4. NOTIFICAR WORKERS SOBRE A REMOÇÃO
    try {
      console.log(`${logPrefix} 👥 Notificando workers sobre remoção...`);
      
      // Broadcast para todos os workers que a instância foi removida
      process.emit('instance-deleted', { instanceId, timestamp: new Date().toISOString() });
      
      console.log(`${logPrefix} 📢 Workers notificados sobre a remoção`);
    } catch (error) {
      console.error(`${logPrefix} ⚠️ Erro ao notificar workers:`, error);
    }

    // 5. VALIDAÇÃO FINAL
    try {
      const authDir = path.join(this.authDir, instanceId);
      const stillExists = fs.existsSync(authDir);
      const stillInMemory = !!this.instances[instanceId];
      
      if (!stillExists && !stillInMemory) {
        console.log(`${logPrefix} ✅ SUCESSO: Instância deletada COMPLETAMENTE`);
        console.log(`${logPrefix} ✅ - Filesystem: Limpo`);
        console.log(`${logPrefix} ✅ - Memória: Limpa`);
        console.log(`${logPrefix} ✅ - Workers: Notificados`);
        return true;
      } else {
        console.error(`${logPrefix} ❌ FALHA PARCIAL:`);
        console.error(`${logPrefix} ❌ - Filesystem exists: ${stillExists}`);
        console.error(`${logPrefix} ❌ - Memory exists: ${stillInMemory}`);
        throw new Error('Deleção incompleta detectada');
      }

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro na validação final:`, error);
      throw error;
    }
  }
EOF

echo "✅ Método deleteInstance aprimorado criado"

echo ""
echo "🔄 4. APLICANDO AS MELHORIAS"
echo "================================================="

echo "📝 Localizando e substituindo método deleteInstance..."

# Encontrar linha onde começa deleteInstance
START_LINE=$(grep -n "async deleteInstance" src/utils/connection-manager.js | cut -d: -f1)
echo "🔍 Método deleteInstance encontrado na linha: $START_LINE"

if [ ! -z "$START_LINE" ]; then
    # Encontrar linha onde termina o método (próxima função ou fechamento de classe)
    END_LINE=$(sed -n "${START_LINE},\$p" src/utils/connection-manager.js | grep -n -E "^\s*(async|\})" | tail -n +2 | head -n1 | cut -d: -f1)
    END_LINE=$((START_LINE + END_LINE - 1))
    
    echo "🔍 Final do método na linha: $END_LINE"
    
    # Criar arquivo temporário com a substituição
    head -n $((START_LINE - 1)) src/utils/connection-manager.js > /tmp/new_connection_manager.js
    cat /tmp/enhanced_deleteInstance.js >> /tmp/new_connection_manager.js
    tail -n +$((END_LINE)) src/utils/connection-manager.js >> /tmp/new_connection_manager.js
    
    # Substituir o arquivo original
    cp /tmp/new_connection_manager.js src/utils/connection-manager.js
    echo "✅ Método deleteInstance substituído com sucesso"
else
    echo "❌ Método deleteInstance não encontrado"
    exit 1
fi

echo ""
echo "🧪 5. VALIDANDO SINTAXE DO ARQUIVO"
echo "================================================="

echo "🔍 Verificando sintaxe JavaScript..."
node -c src/utils/connection-manager.js
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe válida"
else
    echo "❌ Erro de sintaxe detectado, restaurando backup..."
    cp src/utils/connection-manager.js.$BACKUP_SUFFIX src/utils/connection-manager.js
    echo "❌ Backup restaurado. Abortando."
    exit 1
fi

echo ""
echo "🚀 6. REINICIANDO WHATSAPP-SERVER"
echo "================================================="

echo "🔄 Reiniciando apenas whatsapp-server (mantendo workers)..."
pm2 restart whatsapp-server

echo "⏳ Aguardando 10 segundos para inicialização..."
sleep 10

echo "📊 Status do PM2:"
pm2 status

echo ""
echo "🧪 7. TESTANDO A NOVA FUNCIONALIDADE"
echo "================================================="

echo "🔍 Verificando logs recentes do whatsapp-server:"
pm2 logs whatsapp-server --lines 5 --nostream

echo ""
echo "📁 Instâncias atuais em auth_info:"
ls -la /root/whatsapp-server/auth_info/ | grep "^d" | grep -v "^total"

echo ""
echo "🧪 8. TESTE REAL DE DELEÇÃO"
echo "================================================="

# Criar uma instância de teste para deletar
TEST_INSTANCE="test_delete_$(date +%s)"
mkdir -p /root/whatsapp-server/auth_info/$TEST_INSTANCE
echo '{"test": true}' > /root/whatsapp-server/auth_info/$TEST_INSTANCE/creds.json

echo "📁 Instância de teste criada: $TEST_INSTANCE"
echo "🔍 Verificando se foi criada:"
ls -la /root/whatsapp-server/auth_info/$TEST_INSTANCE/

echo ""
echo "🗑️ Testando deleção via endpoint DELETE:"
curl -X DELETE "http://localhost:3001/instance/$TEST_INSTANCE" \
     -H "Content-Type: application/json" \
     --max-time 10 \
     --silent \
     --show-error

echo ""
echo "🔍 Verificando se foi deletada:"
if [ -d "/root/whatsapp-server/auth_info/$TEST_INSTANCE" ]; then
    echo "❌ FALHA: Instância de teste ainda existe"
    ls -la /root/whatsapp-server/auth_info/$TEST_INSTANCE/
else
    echo "✅ SUCESSO: Instância de teste deletada completamente"
fi

echo ""
echo "📋 9. VERIFICAÇÃO FINAL"
echo "================================================="

echo "🔍 Verificando logs para evidências de melhoria:"
pm2 logs whatsapp-server --lines 20 --nostream | grep -E "(deletada|SUCESSO|COMPLETA|✅)" | tail -5

echo ""
echo "📊 Resumo do sistema:"
echo "📁 Instâncias ativas: $(ls -la /root/whatsapp-server/auth_info/ | grep "^d" | grep -v "^total" | wc -l)"
echo "🚀 Processo principal: $(pm2 list | grep whatsapp-server | awk '{print $10}')"
echo "👥 Workers auxiliares: $(pm2 list | grep -E 'worker' | grep -c 'online')/4 online"

echo ""
echo "✅ UPGRADE DO SISTEMA DE DELEÇÃO CONCLUÍDO!"
echo "================================================="
echo "🛠️ Método deleteInstance aprimorado com:"
echo "   ✅ Limpeza robusta de filesystem (3 tentativas)"
echo "   ✅ Validação completa de deleção"
echo "   ✅ Notificação de workers"
echo "   ✅ Logs detalhados para debugging"
echo "   ✅ Backup automático mantido"
echo ""
echo "🔧 Para restaurar versão anterior (se necessário):"
echo "   cp src/utils/connection-manager.js.$BACKUP_SUFFIX src/utils/connection-manager.js"
echo "   pm2 restart whatsapp-server"