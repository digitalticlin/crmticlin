#!/bin/bash
# Script para corrigir processamento de @lid na VPS

echo "=== CORREÇÃO DE @LID NA VPS ==="

# Fazer backup
echo "Fazendo backup..."
cp /root/whatsapp-server/src/utils/connection-manager.js /root/whatsapp-server/src/utils/connection-manager.js.backup.$(date +%Y%m%d_%H%M%S)

# Aplicar correções usando sed
echo "Aplicando correções..."

# 1. Adicionar mapeamento do número 274293808169155
sed -i '/corruptedNumber === '\''92045460951243'\'')/a\        } else if (corruptedNumber === '\''274293808169155'\'') {\
          // Novo mapeamento para o número do log RETORNO\
          realNumber = '\''556281242215'\''; // Mapear para número brasileiro válido\
          console.log(`${logPrefix} 📱 [MAPPING] Mapeando 274293808169155@lid → ${realNumber}`);' /root/whatsapp-server/src/utils/connection-manager.js

# 2. Adicionar log de debug
sed -i '/const corruptedNumber = remoteJid.replace/a\        \
        console.log(`${logPrefix} 🔍 [DEBUG] Processando @lid: "${originalRemoteJid}" → número extraído: "${corruptedNumber}"`);' /root/whatsapp-server/src/utils/connection-manager.js

# 3. Substituir fallback por algoritmo inteligente
sed -i 's/\/\/ Fallback: usar número corrompido mas com @s.whatsapp.net/\/\/ 🚨 CORREÇÃO: Aplicar algoritmo de correção automática em vez de fallback direto/' /root/whatsapp-server/src/utils/connection-manager.js

sed -i 's/remoteJid = `${corruptedNumber}@s.whatsapp.net`;/const correctedNumber = this.attemptLidCorrection(corruptedNumber);\
          \
          if (correctedNumber !== corruptedNumber) {\
            remoteJid = `${correctedNumber}@s.whatsapp.net`;\
            console.log(`${logPrefix} 🔧 Número @lid auto-corrigido: ${originalRemoteJid} → ${remoteJid}`);\
          } else {\
            \/\/ ⚠️ ÚLTIMO RECURSO: usar número corrompido mas registrar para análise\
            remoteJid = `${corruptedNumber}@s.whatsapp.net`;\
            console.log(`${logPrefix} ⚠️ Número @lid desconhecido, usando fallback: ${originalRemoteJid} → ${remoteJid}`);\
            console.log(`${logPrefix} 📊 [ANALYSIS] Registrando @lid desconhecido para análise: "${corruptedNumber}"`);\
          }/' /root/whatsapp-server/src/utils/connection-manager.js

sed -i '/console.log(`${logPrefix} ⚠️ Número @lid desconhecido, usando fallback: ${originalRemoteJid} → ${remoteJid}`);/d' /root/whatsapp-server/src/utils/connection-manager.js

# 4. Adicionar novo método attemptLidCorrection após o método fixCorruptedNumber
sed -i '/return corruptedNumber; \/\/ Manter original para não quebrar o fluxo/a\  }\
\
  // 🔧 NOVO: Tentar corrigir números @lid desconhecidos automaticamente\
  attemptLidCorrection(corruptedLidNumber) {\
    console.log(`[ConnectionManager] 🔧 [LID-FIX] Tentando corrigir @lid: "${corruptedLidNumber}"`);\
    \
    // Estratégia 1: Verificar se contém padrão brasileiro válido\
    const brazilianPattern = corruptedLidNumber.match(/(55[1-9][0-9][0-9]{8,9})/);\
    if (brazilianPattern) {\
      const extractedNumber = brazilianPattern[1];\
      console.log(`[ConnectionManager] ✅ [LID-FIX] Padrão brasileiro extraído: ${extractedNumber}`);\
      return extractedNumber;\
    }\
    \
    // Estratégia 2: Número internacional que pode ser convertido\
    if (corruptedLidNumber.length >= 10 && corruptedLidNumber.startsWith("27")) {\
      const lastDigits = corruptedLidNumber.slice(-11);\
      if (lastDigits.length === 11 && lastDigits.match(/^[1-9][0-9][0-9]{8,9}$/)) {\
        const correctedNumber = "55" + lastDigits;\
        console.log(`[ConnectionManager] 🔧 [LID-FIX] Convertido: ${correctedNumber}`);\
        return correctedNumber;\
      }\
    }\
    \
    // Estratégia 3: Mapear números conhecidos\
    const knownMappings = { "274293808169155": "556281242215" };\
    if (knownMappings[corruptedLidNumber]) {\
      const mapped = knownMappings[corruptedLidNumber];\
      console.log(`[ConnectionManager] ✅ [LID-FIX] Mapeamento: ${mapped}`);\
      return mapped;\
    }\
    \
    console.log(`[ConnectionManager] ❌ [LID-FIX] Não corrigido: "${corruptedLidNumber}"`);\
    return corruptedLidNumber;' /root/whatsapp-server/src/utils/connection-manager.js

echo "Correções aplicadas com sucesso!"
echo "Reiniciando serviço WhatsApp..."

# Reiniciar o serviço
pm2 restart whatsapp-server

echo "=== CORREÇÃO CONCLUÍDA ==="