#!/bin/bash

# ============================================================================
# CORREÇÃO @LID - SCRIPT PASSO A PASSO PARA EXECUÇÃO MANUAL NA VPS
# ============================================================================
# Execute este script na VPS após conectar com: ssh root@31.97.163.57
# 
# O que este script faz:
# 1. Cria backup de segurança
# 2. Adiciona sistema de extração real de números @lid
# 3. Verifica sintaxe
# 4. Reinicia servidor com monitoramento
# ============================================================================

echo "🚀 CORREÇÃO @LID - EXTRAÇÃO REAL DE NÚMEROS"
echo "=========================================="
echo "Este script vai corrigir o problema de @lid extraindo o número REAL da mensagem"
echo ""

# Ir para diretório correto
cd /root/whatsapp-server/src/utils
echo "✅ ETAPA 1: Navegando para diretório connection-manager"
echo "📍 Diretório atual: $(pwd)"
echo ""

# Verificar se arquivo existe
if [ ! -f "connection-manager.js" ]; then
    echo "❌ ERRO: Arquivo connection-manager.js não encontrado!"
    echo "📍 Arquivos no diretório:"
    ls -la
    exit 1
fi
echo "✅ ETAPA 2: Arquivo connection-manager.js encontrado"
echo "📊 Tamanho: $(wc -l < connection-manager.js) linhas"
echo ""

# Criar backup com timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="connection-manager.js.backup-lid-fix-$TIMESTAMP"
cp connection-manager.js "$BACKUP_FILE"
echo "✅ ETAPA 3: Backup criado - $BACKUP_FILE"
echo ""

# Verificar sintaxe atual
echo "🔍 ETAPA 4: Verificando sintaxe atual..."
node -c connection-manager.js
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Arquivo atual tem erro de sintaxe!"
    exit 1
fi
echo "✅ ETAPA 4: Sintaxe atual OK"
echo ""

# Verificar se correção já foi aplicada
if grep -q "REAL_LID_NUMBER_EXTRACTOR" connection-manager.js; then
    echo "⚠️ AVISO: Correção parece já ter sido aplicada"
    echo "Deseja continuar mesmo assim? (s/N)"
    read -r response
    if [[ "$response" != "s" && "$response" != "S" ]]; then
        echo "❌ Operação cancelada pelo usuário"
        exit 0
    fi
fi

echo "🔧 ETAPA 5: Adicionando sistema de extração real..."

# Encontrar linha da classe ConnectionManager
CLASS_LINE=$(grep -n "class ConnectionManager" connection-manager.js | cut -d: -f1)
if [ -z "$CLASS_LINE" ]; then
    echo "❌ ERRO: Classe ConnectionManager não encontrada!"
    exit 1
fi
echo "📍 Classe ConnectionManager encontrada na linha $CLASS_LINE"

# Criar sistema de extração
cat > real-lid-extractor.js << 'EOFEXTRACTOR'

// ============================================================================
// 🔧 REAL @LID EXTRACTOR - EXTRAI NÚMERO VERDADEIRO DA MENSAGEM
// ============================================================================
const REAL_LID_NUMBER_EXTRACTOR = {
  
  extractRealNumber: function(message, remoteJid, logPrefix = '') {
    // Ignorar grupos COMPLETAMENTE
    if (remoteJid && (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast'))) {
      return remoteJid; // Grupos não são afetados
    }
    
    // Se não é @lid, passar direto
    if (!remoteJid || !remoteJid.includes('@lid')) {
      return remoteJid;
    }
    
    const originalLid = remoteJid;
    console.log(`${logPrefix} 🔍 [REAL_LID] @lid detectado: "${originalLid}"`);
    
    // ESTRATÉGIA 1: Buscar em verifiedName (campo comum com número real)
    if (message.verifiedName) {
      console.log(`${logPrefix} 🔍 [REAL_LID] Analisando verifiedName: "${message.verifiedName}"`);
      const phonePattern = /55\d{10,11}/;
      const match = message.verifiedName.match(phonePattern);
      if (match) {
        const realNumber = match[0] + '@s.whatsapp.net';
        console.log(`${logPrefix} ✅ [REAL_LID] SUCESSO - Número extraído de verifiedName: ${realNumber}`);
        return realNumber;
      }
    }
    
    // ESTRATÉGIA 2: Buscar número em pushName 
    if (message.pushName) {
      console.log(`${logPrefix} 🔍 [REAL_LID] Analisando pushName: "${message.pushName}"`);
      const phonePattern = /(\d{10,13})/;
      const match = message.pushName.match(phonePattern);
      if (match && match[1].length >= 10) {
        let phone = match[1];
        if (!phone.startsWith('55')) phone = '55' + phone;
        if (phone.match(/^55\d{2}\d{8,9}$/)) {
          const realNumber = phone + '@s.whatsapp.net';
          console.log(`${logPrefix} ✅ [REAL_LID] SUCESSO - Número extraído de pushName: ${realNumber}`);
          return realNumber;
        }
      }
    }
    
    // ESTRATÉGIA 3: Buscar qualquer número brasileiro na estrutura completa
    console.log(`${logPrefix} 🔍 [REAL_LID] Procurando na estrutura completa da mensagem...`);
    const messageStr = JSON.stringify(message);
    const phonePattern = /55\d{10,11}/g;
    const matches = messageStr.match(phonePattern);
    if (matches && matches[0]) {
      const realNumber = matches[0] + '@s.whatsapp.net';
      console.log(`${logPrefix} ✅ [REAL_LID] SUCESSO - Número encontrado na estrutura: ${realNumber}`);
      return realNumber;
    }
    
    // ESTRATÉGIA 4: Log detalhado para análise manual
    console.log(`${logPrefix} 🚨 [REAL_LID] FALHA - Não conseguiu extrair número real`);
    console.log(`${logPrefix} 🚨 [REAL_LID] @lid original: ${originalLid}`);
    console.log(`${logPrefix} 🚨 [REAL_LID] verifiedName: ${message.verifiedName || 'N/A'}`);
    console.log(`${logPrefix} 🚨 [REAL_LID] pushName: ${message.pushName || 'N/A'}`);
    console.log(`${logPrefix} 🚨 [REAL_LID] messageTimestamp: ${message.messageTimestamp || 'N/A'}`);
    console.log(`${logPrefix} 🚨 [REAL_LID] Campos da mensagem: ${Object.keys(message).join(', ')}`);
    
    // IMPORTANTE: Retornar null para ignorar mensagem @lid sem número real
    console.log(`${logPrefix} ⚠️ [REAL_LID] IGNORANDO mensagem @lid sem número real identificado`);
    return null;
  }
};

// ============================================================================
// FIM DO REAL LID EXTRACTOR
// ============================================================================

EOFEXTRACTOR

echo "✅ Sistema de extração criado"

# Inserir sistema antes da classe
head -n $((CLASS_LINE - 1)) connection-manager.js > temp-new-file.js
cat real-lid-extractor.js >> temp-new-file.js
tail -n +${CLASS_LINE} connection-manager.js >> temp-new-file.js

# Substituir arquivo
mv temp-new-file.js connection-manager.js
rm real-lid-extractor.js

echo "✅ ETAPA 5: Sistema de extração inserido antes da classe"
echo ""

echo "🔧 ETAPA 6: Adicionando interceptação no processamento..."

# Encontrar linha do remoteJid
JID_LINE=$(grep -n "let remoteJid = message.key.remoteJid;" connection-manager.js | cut -d: -f1)
if [ -z "$JID_LINE" ]; then
    echo "❌ ERRO: Linha 'let remoteJid = message.key.remoteJid;' não encontrada!"
    echo "Restaurando backup..."
    cp "$BACKUP_FILE" connection-manager.js
    exit 1
fi
echo "📍 RemoteJid encontrado na linha $JID_LINE"

# Adicionar interceptação após essa linha
sed -i "${JID_LINE}a\\
\\
      // 🔧 INTERCEPTAÇÃO REAL @LID - EXTRAI NÚMERO VERDADEIRO\\
      const originalRemoteJid = remoteJid;\\
      remoteJid = REAL_LID_NUMBER_EXTRACTOR.extractRealNumber(message, remoteJid, logPrefix);\\
      \\
      // Se extração retornou null, ignorar mensagem @lid\\
      if (remoteJid === null) {\\
        console.log(\\\`\\\${logPrefix} 🚫 [REAL_LID] IGNORANDO mensagem @lid sem número real: \\\${originalRemoteJid}\\\`);\\
        return; // Sair da função, não processar esta mensagem\\
      }\\
      \\
      // Log se número foi extraído/corrigido\\
      if (originalRemoteJid !== remoteJid && originalRemoteJid.includes('@lid')) {\\
        console.log(\\\`\\\${logPrefix} ✅ [REAL_LID] NÚMERO REAL EXTRAÍDO: \\\${originalRemoteJid} → \\\${remoteJid}\\\`);\\
      }" connection-manager.js

echo "✅ ETAPA 6: Interceptação adicionada"
echo ""

echo "🔍 ETAPA 7: Verificando sintaxe após modificações..."
node -c connection-manager.js
if [ $? -eq 0 ]; then
    echo "✅ ETAPA 7: Sintaxe OK após modificações"
else
    echo "❌ ERRO: Sintaxe inválida após modificações!"
    echo "Restaurando backup..."
    cp "$BACKUP_FILE" connection-manager.js
    echo "✅ Backup restaurado"
    exit 1
fi
echo ""

echo "✅ ETAPA 8: Confirmando que sistema foi adicionado..."
if grep -q "REAL_LID_NUMBER_EXTRACTOR" connection-manager.js; then
    echo "✅ ETAPA 8: Sistema de extração confirmado no arquivo"
else
    echo "❌ ERRO: Sistema não foi adicionado corretamente!"
    echo "Restaurando backup..."
    cp "$BACKUP_FILE" connection-manager.js
    exit 1
fi
echo ""

echo "📊 ETAPA 9: Verificando status atual do servidor..."
cd /root/whatsapp-server

# Status antes do restart
echo "📊 Status das instâncias ANTES do restart:"
pm2 list | grep whatsapp-server
echo ""

echo "🔄 ETAPA 10: Reiniciando servidor WhatsApp..."
pm2 restart whatsapp-server

echo "⏱️ Aguardando 20 segundos para estabilização..."
sleep 20

echo "📊 ETAPA 11: Verificando status após restart..."
pm2 list | grep whatsapp-server
echo ""

echo "📜 ETAPA 12: Verificando logs recentes..."
echo "Últimas 15 linhas dos logs (filtrando webhooks para clareza):"
pm2 logs whatsapp-server --lines 30 | grep -v "Webhook LeadUpdate" | tail -15
echo ""

echo "🎉 CORREÇÃO APLICADA COM SUCESSO!"
echo "=========================================="
echo ""
echo "📋 RESUMO DO QUE FOI FEITO:"
echo "✅ Backup criado: $BACKUP_FILE"
echo "✅ Sistema REAL_LID_NUMBER_EXTRACTOR adicionado"
echo "✅ Interceptação de @lid configurada"
echo "✅ Sintaxe verificada e OK"
echo "✅ Servidor reiniciado"
echo ""
echo "🔍 MONITORAMENTO:"
echo "Agora o sistema vai:"
echo "- Detectar mensagens @lid: [REAL_LID] @lid detectado"
echo "- Extrair número real: [REAL_LID] SUCESSO - Número extraído"
echo "- Ou ignorar se não conseguir: [REAL_LID] IGNORANDO"
echo ""
echo "Para monitorar em tempo real:"
echo "pm2 logs whatsapp-server | grep REAL_LID"
echo ""
echo "✅ IMPLEMENTAÇÃO COMPLETA!"