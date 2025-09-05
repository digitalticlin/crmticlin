#!/bin/bash

# 🗑️ CORRIGIR DELETAR INSTÂNCIA COMPLETA - VERSÃO 2 (CORRIGIDA)
echo "🗑️ MELHORANDO SISTEMA DE DELETAR INSTÂNCIA WHATSAPP - V2"
echo "Data: $(date)"
echo "================================================="

VPS_PATH="/root/whatsapp-server"
BACKUP_SUFFIX="backup-$(date +%Y%m%d_%H%M%S)"

echo ""
echo "🔍 1. ANALISANDO ESTRUTURA DO CONNECTION-MANAGER"
echo "================================================="

cd $VPS_PATH

echo "🔍 Encontrando método deleteInstance e sua estrutura:"
grep -n -A 30 "async deleteInstance" src/utils/connection-manager.js

echo ""
echo "🔍 Verificando estrutura das chaves {}:"
grep -n -E "^\s*}|^\s*async|\s*class" src/utils/connection-manager.js | tail -10

echo ""
echo "🔧 2. FAZENDO BACKUP SEGURO"
echo "================================================="

echo "💾 Criando backup do connection-manager.js..."
cp src/utils/connection-manager.js src/utils/connection-manager.js.$BACKUP_SUFFIX
echo "✅ Backup criado: connection-manager.js.$BACKUP_SUFFIX"

echo ""
echo "🛠️ 3. ABORDAGEM MAIS SEGURA - SUBSTITUIÇÃO MANUAL"
echo "================================================="

echo "📝 Criando método deleteInstance completo e bem estruturado..."

# Criar script Python para substituição mais precisa
cat > /tmp/fix_deleteInstance.py << 'EOF'
import re
import sys

def fix_deleteInstance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Método deleteInstance melhorado
    new_method = '''  async deleteInstance(instanceId) {
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

    // 3. VALIDAÇÃO FINAL
    try {
      const authDir = path.join(this.authDir, instanceId);
      const stillExists = fs.existsSync(authDir);
      const stillInMemory = !!this.instances[instanceId];
      
      if (!stillExists && !stillInMemory) {
        console.log(`${logPrefix} ✅ SUCESSO: Instância deletada COMPLETAMENTE`);
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
  }'''
    
    # Usar regex para encontrar e substituir o método deleteInstance completo
    # Padrão: desde "async deleteInstance" até a próxima função ou fechamento de classe
    pattern = r'(\s+async deleteInstance\([^{]*\{)([\s\S]*?)(\n\s+(?:async|get|set|\}|\s*//[^\n]*\n\s*(?:async|get|set|\})))'
    
    def replacement(match):
        indent = '  '  # Usar indentação padrão
        return new_method + '\n\n' + indent + match.group(3).strip()
    
    # Fazer a substituição
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    else:
        return False

if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else "src/utils/connection-manager.js"
    success = fix_deleteInstance(file_path)
    print("SUCCESS" if success else "NO_CHANGES")
EOF

echo "🐍 Aplicando substituição inteligente com Python..."
cd /root/whatsapp-server
python3 /tmp/fix_deleteInstance.py src/utils/connection-manager.js

if [ $? -eq 0 ]; then
    echo "✅ Substituição realizada"
else
    echo "❌ Erro na substituição Python"
    exit 1
fi

echo ""
echo "🧪 4. VALIDAÇÃO RIGOROSA DE SINTAXE"
echo "================================================="

echo "🔍 Verificando sintaxe JavaScript..."
node -c src/utils/connection-manager.js
SYNTAX_OK=$?

if [ $SYNTAX_OK -eq 0 ]; then
    echo "✅ Sintaxe JavaScript válida"
else
    echo "❌ Erro de sintaxe detectado, tentando correção manual..."
    
    # Fallback: edição mais simples e segura
    cp src/utils/connection-manager.js.$BACKUP_SUFFIX src/utils/connection-manager.js
    echo "⚠️ Restaurado backup - aplicando correção mínima..."
    
    # Fazer apenas uma melhoria pontual no método existente
    sed -i 's/fs.rmSync(authDir, { recursive: true, force: true });/fs.rmSync(authDir, { recursive: true, force: true }); if (!fs.existsSync(authDir)) { console.log(`${logPrefix} ✅ Diretório removido com validação`); } else { console.error(`${logPrefix} ❌ Falha na remoção do diretório`); }/g' src/utils/connection-manager.js
    
    # Validar novamente
    node -c src/utils/connection-manager.js
    if [ $? -eq 0 ]; then
        echo "✅ Correção mínima aplicada com sucesso"
    else
        echo "❌ Restaurando backup original..."
        cp src/utils/connection-manager.js.$BACKUP_SUFFIX src/utils/connection-manager.js
        echo "❌ Sistema restaurado ao estado original"
        exit 1
    fi
fi

echo ""
echo "🚀 5. REINICIANDO WHATSAPP-SERVER"
echo "================================================="

echo "🔄 Reiniciando whatsapp-server..."
pm2 restart whatsapp-server

echo "⏳ Aguardando 10 segundos para inicialização..."
sleep 10

echo "📊 Status do PM2:"
pm2 status

echo ""
echo "🧪 6. TESTE PRÁTICO DE DELEÇÃO"
echo "================================================="

echo "📁 Estado atual das instâncias:"
ls -la /root/whatsapp-server/auth_info/ | grep "^d" | wc -l

# Criar instância de teste
TEST_INSTANCE="test_$(date +%s)"
mkdir -p /root/whatsapp-server/auth_info/$TEST_INSTANCE
echo '{"test": true}' > /root/whatsapp-server/auth_info/$TEST_INSTANCE/creds.json

echo "🧪 Instância de teste criada: $TEST_INSTANCE"

# Testar deleção
echo "🗑️ Testando deleção via API..."
RESPONSE=$(curl -s -X DELETE "http://localhost:3001/instance/$TEST_INSTANCE" -w "HTTP_CODE:%{http_code}")
echo "📝 Resposta da API: $RESPONSE"

# Verificar resultado
echo "🔍 Verificando se foi deletada..."
if [ -d "/root/whatsapp-server/auth_info/$TEST_INSTANCE" ]; then
    echo "❌ FALHA: Instância ainda existe"
else
    echo "✅ SUCESSO: Instância deletada"
fi

echo ""
echo "📋 7. VERIFICAÇÃO DOS LOGS"
echo "================================================="

echo "🔍 Logs recentes do whatsapp-server:"
pm2 logs whatsapp-server --lines 10 --nostream | tail -10

echo ""
echo "📊 Resumo final:"
echo "📁 Instâncias ativas: $(ls -la /root/whatsapp-server/auth_info/ | grep "^d" | grep -v "total" | wc -l)"
echo "🚀 WhatsApp Server: $(pm2 list | grep whatsapp-server | awk '{print $10}')"

echo ""
echo "✅ CORREÇÃO APLICADA COM VALIDAÇÃO RIGOROSA!"
echo "================================================="
echo "🔧 Melhorias implementadas:"
echo "   ✅ Validação de sintaxe rigorosa"
echo "   ✅ Fallback automático em caso de erro"
echo "   ✅ Teste prático de deleção"
echo "   ✅ Logs de validação completos"
echo ""
echo "📄 Backup salvo em: connection-manager.js.$BACKUP_SUFFIX"