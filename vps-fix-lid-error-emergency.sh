#!/bin/bash

# 🚨 CORREÇÃO EMERGENCIAL - ERRO LidProcessor
echo "🚨 CORREÇÃO EMERGENCIAL - SERVIDOR EM CRASH"
echo "Erro: ReferenceError: LidProcessor is not defined"
echo "Data: $(date)"
echo "================================================="

VPS_SERVER="root@31.97.163.57"
VPS_PATH="/root/whatsapp-server"

echo ""
echo "⚡ 1. PARANDO SERVIDOR EM CRASH LOOP"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🛑 Parando whatsapp-server em crash...'
pm2 stop whatsapp-server

echo '📊 Status após parar:'
pm2 list | grep whatsapp-server
"

echo ""
echo "🔧 2. CORRIGINDO IMPORT DO LIDPROCESSOR"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🔍 Verificando onde está o erro de import...'
grep -n 'LidProcessor' src/utils/connection-manager.js | head -3

echo '🔧 Corrigindo path do require do LidProcessor...'

# Corrigir o path do require - estava errado
sed -i 's|require(\"./lid-processor\")|require(\"./lid-processor.js\")|g' src/utils/connection-manager.js

# Verificar se o arquivo existe
if [ -f src/utils/lid-processor.js ]; then
    echo '✅ Arquivo lid-processor.js existe'
else
    echo '❌ Arquivo lid-processor.js não encontrado! Criando...'
    # Recriar arquivo se não existir
    cat > src/utils/lid-processor.js << 'EOF'
class LidProcessor {
  constructor() {
    console.log('🎯 [LidProcessor] Inicializado (versão de emergência)');
    this.knownLidMappings = new Map([
      ['274293808169155', '556281242215']
    ]);
    this.processingCache = new Map();
    this.stats = { total: 0, corrected: 0, cached: 0, errors: 0 };
  }
  
  processLid(lidNumber) {
    this.stats.total++;
    const cleanNumber = lidNumber.toString().replace(/@lid$/, '');
    
    if (this.processingCache.has(cleanNumber)) {
      this.stats.cached++;
      return this.processingCache.get(cleanNumber);
    }
    
    if (this.knownLidMappings.has(cleanNumber)) {
      const corrected = this.knownLidMappings.get(cleanNumber);
      this.stats.corrected++;
      this.processingCache.set(cleanNumber, corrected);
      console.log(\`✅ [LidProcessor] Correção: \${cleanNumber}@lid → \${corrected}\`);
      return corrected;
    }
    
    return cleanNumber;
  }
  
  getStats() {
    return { ...this.stats, cacheSize: this.processingCache.size };
  }
  
  addMapping(lidNumber, realNumber) {
    const cleanLid = lidNumber.toString().replace(/@lid$/, '');
    this.knownLidMappings.set(cleanLid, realNumber.toString());
    this.processingCache.set(cleanLid, realNumber.toString());
  }
}

module.exports = LidProcessor;
EOF
    echo '✅ LidProcessor recriado (versão simplificada)'
fi

echo '🔍 Verificando import corrigido:'
grep -n 'require.*lid-processor' src/utils/connection-manager.js
"

echo ""
echo "🧪 3. TESTANDO SINTAXE"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📝 Testando sintaxe do lid-processor.js...'
node -c src/utils/lid-processor.js
if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe lid-processor.js OK'
else
    echo '❌ Sintaxe ERRO no lid-processor.js'
fi

echo '📝 Testando sintaxe do connection-manager.js...'
node -c src/utils/connection-manager.js
if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe connection-manager.js OK'
else
    echo '❌ Sintaxe ERRO no connection-manager.js'
    echo '🔄 Restaurando backup do connection-manager...'
    BACKUP=\$(ls -t src/utils/connection-manager.js.backup-remove-automation* | head -1)
    if [ -n \"\$BACKUP\" ]; then
        cp \"\$BACKUP\" src/utils/connection-manager.js
        echo \"✅ Backup restaurado: \$BACKUP\"
    fi
fi

echo '📝 Testando sintaxe do server.js...'
node -c server.js
if [ \$? -eq 0 ]; then
    echo '✅ Sintaxe server.js OK'
else
    echo '❌ Sintaxe ERRO no server.js'
fi
"

echo ""
echo "⚡ 4. TENTATIVA DE RESTART EMERGENCIAL"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '🚀 Tentando restart emergencial...'
pm2 start whatsapp-server

echo '⏳ Aguardando 10 segundos...'
sleep 10

echo '📊 Status após restart:'
pm2 list

echo '🎯 Testando se responde:'
curl -s http://localhost:3001/health | head -3 || echo '❌ Ainda não responde'
"

echo ""
echo "🔍 5. VERIFICANDO LOGS DE ERRO"
echo "================================================="
ssh $VPS_SERVER "
cd $VPS_PATH

echo '📋 Últimos logs de erro:'
pm2 logs whatsapp-server --lines 10 --nostream | tail -10
"

echo ""
echo "✅ CORREÇÃO EMERGENCIAL CONCLUÍDA"