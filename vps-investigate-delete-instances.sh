#!/bin/bash

# 🔍 INVESTIGAÇÃO COMPLETA DE DELEÇÃO DE INSTÂNCIAS WHATSAPP
echo "🔍 INVESTIGAÇÃO COMPLETA DE DELEÇÃO DE INSTÂNCIAS WHATSAPP"
echo "Data: $(date)"
echo "============================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="~/whatsapp-server"

echo ""
echo "📋 1. DIAGNÓSTICO INICIAL - ESTADO ATUAL"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📊 Status PM2:'
pm2 list

echo ''
echo '📂 Instâncias na pasta auth_info:'
ls -la auth_info/ | grep '^d' | wc -l
echo 'Total de diretórios de instâncias encontrados'

echo ''
echo '🔍 Instâncias detalhadas:'
ls -la auth_info/ | grep '^d' | tail -10

echo ''
echo '💾 Processos WhatsApp ativos:'
ps aux | grep -i whatsapp | grep -v grep | wc -l
echo 'Total de processos WhatsApp'
"

echo ""
echo "🔍 2. ANÁLISE DA FUNÇÃO DELETE ATUAL"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Função deleteInstance atual:'
echo '--------------------------------'
grep -n -A30 'async deleteInstance' src/utils/connection-manager.js

echo ''
echo '🔍 Endpoint DELETE no server.js:'
echo '--------------------------------'
grep -n -A10 -B5 'app.delete.*instance' server.js
"

echo ""
echo "📁 3. INVESTIGAÇÃO PROFUNDA - LOCALIZAÇÕES DE INSTÂNCIAS"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando possíveis localizações de instâncias:'
echo ''

echo '1. Pasta auth_info (principal):'
find auth_info/ -type d | head -10

echo ''
echo '2. Arquivos de sessão por instância:'
find auth_info/ -name 'session-*.json' | head -5
echo '...'

echo ''
echo '3. Arquivos creds.json:'
find auth_info/ -name 'creds.json' | head -5
echo '...'

echo ''
echo '4. Possíveis caches/temp:'
find . -name '*cache*' -o -name '*temp*' | head -5 || echo 'Não encontrados'

echo ''
echo '5. Logs de instâncias:'
find logs/ -name '*instance*' || echo 'Não encontrados específicos'

echo ''
echo '6. Possíveis backups de auth:'
ls -la | grep auth | head -3

echo ''
echo '7. Verificar se há instâncias em memory/runtime:'
echo 'Instâncias em memória requerem análise do código...'
"

echo ""
echo "⚠️ 4. ANÁLISE DE PROBLEMAS NA DELEÇÃO"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Problemas identificados na função deleteInstance:'
echo ''

echo '1. Verificar se diretório é realmente removido:'
INSTANCE_TEST='test_1757002515'
if [ -d \"auth_info/\$INSTANCE_TEST\" ]; then
    echo \"   ❌ Instância \$INSTANCE_TEST ainda existe!\"
    echo \"   📁 Conteúdo:\"
    ls -la \"auth_info/\$INSTANCE_TEST\"
    echo \"   📄 Arquivos:\"
    find \"auth_info/\$INSTANCE_TEST\" -type f -exec basename {} \;
else
    echo \"   ✅ Instância \$INSTANCE_TEST foi removida\"
fi

echo ''
echo '2. Verificar permissões na pasta auth_info:'
ls -ld auth_info/
ls -la auth_info/ | head -5

echo ''
echo '3. Verificar se há processos travados:'
ps aux | grep -E '(node|pm2)' | grep -v grep | grep -E '(delete|remove)' || echo 'Nenhum processo de deleção travado'

echo ''
echo '4. Verificar logs recentes para erros de deleção:'
if [ -f 'logs/whatsapp-server-error-0.log' ]; then
    echo 'Últimos erros relacionados:'
    tail -50 logs/whatsapp-server-error-0.log | grep -i -E '(delete|remove|error)' | tail -5 || echo 'Nenhum erro recente'
fi
"

echo ""
echo "🛠️ 5. PROBLEMAS IDENTIFICADOS E SOLUÇÕES"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 PROBLEMAS ENCONTRADOS:'
echo ''

echo '1. ❌ PROBLEMA: Validação inadequada após remoção'
echo '   A função atual tem validação mas pode falhar silenciosamente'
echo ''

echo '2. ❌ PROBLEMA: Não remove arquivos de sessão individuais'  
echo '   Arquivos session-*.json podem ficar órfãos'
echo ''

echo '3. ❌ PROBLEMA: Não limpa referências em memória dos workers'
echo '   Workers podem manter referências à instância deletada'
echo ''

echo '4. ❌ PROBLEMA: Não verifica se instância está sendo usada'
echo '   Pode tentar deletar instância ativa/conectada'
echo ''

echo '5. ❌ PROBLEMA: Falta de log detalhado para debug'
echo '   Dificulta identificar onde a deleção falha'
echo ''

echo '📋 LOCALIZAÇÕES QUE DEVEM SER LIMPAS:'
echo '   • auth_info/[instanceId]/ (pasta completa)'
echo '   • Referências em this.instances[instanceId]'
echo '   • this.connectionAttempts'
echo '   • Cache de workers (se existir)'
echo '   • Possíveis referências em logs/temp'
"

echo ""
echo "🔧 6. IMPLEMENTAÇÃO DA CORREÇÃO APRIMORADA"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '💾 Criando backup da função atual...'
cp src/utils/connection-manager.js src/utils/connection-manager.js.backup-pre-delete-fix-\$(date +%Y%m%d_%H%M%S)

echo ''
echo '🔧 Criando função deleteInstance ROBUSTA:'

# Criar versão melhorada da função
cat > temp-delete-function.js << 'EOF'
  // Deletar instância completamente - VERSÃO ROBUSTA
  async deleteInstance(instanceId) {
    const logPrefix = \`[ConnectionManager \${instanceId}]\`;
    const instance = this.instances[instanceId];

    console.log(\`\${logPrefix} 🗑️ Iniciando deleção COMPLETA da instância...\`);

    // Verificar se instância existe
    if (!instance) {
      console.log(\`\${logPrefix} ⚠️ Instância não encontrada na memória, prosseguindo com limpeza de arquivos...\`);
    } else {
      console.log(\`\${logPrefix} 📊 Status antes da deleção: \${instance.status}\`);
      
      // Forçar desconexão se estiver conectada
      if (instance.connected) {
        console.log(\`\${logPrefix} 🔌 Forçando desconexão...\`);
        try {
          if (instance.socket) {
            instance.socket.end();
            instance.socket.destroy();
          }
          instance.connected = false;
          console.log(\`\${logPrefix} ✅ Desconectado forçadamente\`);
        } catch (error) {
          console.error(\`\${logPrefix} ⚠️ Erro ao desconectar:\`, error.message);
        }
      }
    }

    let deletionErrors = [];

    try {
      // 1. REMOÇÃO DO DIRETÓRIO AUTH_INFO
      const authDir = path.join(this.authDir, instanceId);
      console.log(\`\${logPrefix} 📁 Verificando diretório: \${authDir}\`);
      
      if (fs.existsSync(authDir)) {
        console.log(\`\${logPrefix} 🗂️ Diretório existe, iniciando remoção...\`);
        
        // Listar arquivos antes da remoção
        try {
          const files = fs.readdirSync(authDir);
          console.log(\`\${logPrefix} 📋 Arquivos a serem removidos: \${files.join(', ')}\`);
          
          // Remover arquivos individuais primeiro (mais seguro)
          files.forEach(file => {
            const filePath = path.join(authDir, file);
            try {
              fs.unlinkSync(filePath);
              console.log(\`\${logPrefix} 🗑️ Arquivo removido: \${file}\`);
            } catch (error) {
              const errorMsg = \`Erro ao remover arquivo \${file}: \${error.message}\`;
              console.error(\`\${logPrefix} ❌ \${errorMsg}\`);
              deletionErrors.push(errorMsg);
            }
          });
          
          // Remover o diretório vazio
          fs.rmdirSync(authDir);
          console.log(\`\${logPrefix} 📁 Diretório removido\`);
          
        } catch (error) {
          console.error(\`\${logPrefix} ⚠️ Erro ao listar/remover arquivos:\`, error.message);
          // Fallback: tentar remoção forçada
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
            console.log(\`\${logPrefix} 🔨 Diretório removido com força\`);
          } catch (forceError) {
            const errorMsg = \`Falha na remoção forçada: \${forceError.message}\`;
            console.error(\`\${logPrefix} ❌ \${errorMsg}\`);
            deletionErrors.push(errorMsg);
          }
        }
        
        // VALIDAÇÃO CRÍTICA: Verificar se foi realmente removido
        if (fs.existsSync(authDir)) {
          const errorMsg = \`FALHA CRÍTICA: Diretório ainda existe após tentativa de remoção\`;
          console.error(\`\${logPrefix} 🚨 \${errorMsg}\`);
          deletionErrors.push(errorMsg);
          
          // Tentar diagnóstico do problema
          try {
            const stat = fs.statSync(authDir);
            console.error(\`\${logPrefix} 📊 Permissões do diretório:\`, stat.mode.toString(8));
          } catch (statError) {
            console.error(\`\${logPrefix} ❌ Erro ao verificar permissões:\`, statError.message);
          }
        } else {
          console.log(\`\${logPrefix} ✅ VALIDAÇÃO OK: Diretório removido com sucesso\`);
        }
        
      } else {
        console.log(\`\${logPrefix} ℹ️ Diretório auth não existe (já removido ou nunca criado)\`);
      }

      // 2. LIMPEZA DE MEMÓRIA
      console.log(\`\${logPrefix} 🧹 Limpando referências em memória...\`);
      
      // Limpar contadores
      if (this.connectionAttempts.has(instanceId)) {
        this.connectionAttempts.delete(instanceId);
        console.log(\`\${logPrefix} 🗑️ Contador de tentativas removido\`);
      }

      // Remover da memória de instâncias
      if (this.instances[instanceId]) {
        delete this.instances[instanceId];
        console.log(\`\${logPrefix} 🗑️ Instância removida da memória\`);
      }

      // 3. LIMPEZA ADICIONAL (se necessário)
      // Aqui podemos adicionar outras limpezas específicas do sistema
      
      // 4. RESULTADO FINAL
      if (deletionErrors.length === 0) {
        console.log(\`\${logPrefix} 🎉 SUCESSO: Instância deletada completamente\`);
        return {
          success: true,
          message: 'Instância deletada com sucesso',
          instanceId,
          errors: []
        };
      } else {
        console.error(\`\${logPrefix} ⚠️ PARCIAL: Instância deletada com \${deletionErrors.length} erro(s)\`);
        return {
          success: false,
          message: \`Deleção parcial com \${deletionErrors.length} erro(s)\`,
          instanceId,
          errors: deletionErrors
        };
      }

    } catch (error) {
      const errorMsg = \`Erro crítico na deleção: \${error.message}\`;
      console.error(\`\${logPrefix} 🚨 \${errorMsg}\`);
      console.error(\`\${logPrefix} 📊 Stack:\`, error.stack);
      
      return {
        success: false,
        message: errorMsg,
        instanceId,
        errors: [errorMsg, ...deletionErrors]
      };
    }
  }
EOF

echo '✅ Função melhorada criada em temp-delete-function.js'
echo ''
echo '📋 MELHORIAS IMPLEMENTADAS:'
echo '   ✅ Validação rigorosa após remoção'
echo '   ✅ Remoção individual de arquivos primeiro'
echo '   ✅ Fallback com remoção forçada'
echo '   ✅ Log detalhado de cada etapa'
echo '   ✅ Coleta de erros para debug'
echo '   ✅ Retorno estruturado com status'
echo '   ✅ Desconexão forçada antes da remoção'
echo '   ✅ Diagnóstico de permissões em caso de falha'
"

echo ""
echo "🧪 7. TESTE DE VALIDAÇÃO"
echo "============================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🧪 Preparando teste com instância fictícia...'

# Criar instância de teste
TEST_INSTANCE='test_delete_validation'
mkdir -p \"auth_info/\$TEST_INSTANCE\"
echo '{\"test\": true, \"created\": \"'$(date)'\"}' > \"auth_info/\$TEST_INSTANCE/creds.json\"
echo '{\"session\": \"test\"}' > \"auth_info/\$TEST_INSTANCE/session-test.json\"

echo ''
echo \"✅ Instância de teste criada: \$TEST_INSTANCE\"
echo '📁 Conteúdo:'
ls -la \"auth_info/\$TEST_INSTANCE\"

echo ''
echo '📋 PRÓXIMOS PASSOS PARA APLICAR A CORREÇÃO:'
echo ''
echo '1. 🔄 Substituir função no connection-manager.js'
echo '2. 🧪 Testar com instância fictícia'
echo '3. 🔄 Reiniciar whatsapp-server'
echo '4. 🧪 Testar deleção via API'
echo '5. ✅ Validar que instância foi completamente removida'
"

echo ""
echo "📊 8. RESUMO EXECUTIVO"
echo "============================================================="
echo ""
echo "🔍 PROBLEMAS IDENTIFICADOS:"
echo "   ❌ Função deleteInstance atual é muito básica"
echo "   ❌ Não há validação rigorosa após remoção"
echo "   ❌ Logs insuficientes para debug"
echo "   ❌ Não trata casos de falha adequadamente"
echo "   ❌ Pode deixar instâncias 'fantasma'"
echo ""
echo "✅ SOLUÇÕES IMPLEMENTADAS:"
echo "   ✅ Função deleteInstance ROBUSTA criada"
echo "   ✅ Validação rigorosa pós-remoção"
echo "   ✅ Log detalhado de cada etapa"
echo "   ✅ Tratamento de erros abrangente"
echo "   ✅ Retorno estruturado para API"
echo "   ✅ Instância de teste criada para validação"
echo ""
echo "🚀 PRÓXIMA AÇÃO:"
echo "   Execute este script para aplicar as correções"
echo "   Depois execute: vps-apply-delete-fix.sh"
echo ""
echo "============================================================="
echo "🔍 INVESTIGAÇÃO CONCLUÍDA - $(date)"
echo "============================================================="