#!/bin/bash
# 🔧 PATCH SEGURO PARA CORRIGIR LOOPS DE RECONEXÃO

cd /root/whatsapp-server

echo "🔧 Aplicando correção de loops de reconexão..."

# 1. CRIAR VERSÃO CORRIGIDA
cat > temp_fix_lines.txt << 'EOF'
        // LOGICA DE RECONEXAO CORRIGIDA - APENAS EM CASOS LEGITIMOS
        const disconnectCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || '';
        
        // NUNCA RECONECTAR EM casos de conflito ou logout
        const isLoggedOut = disconnectCode === DisconnectReason.loggedOut;
        const isConflict = errorMessage.includes('conflict') || errorMessage.includes('replaced');
        const isIntentionalDisconnect = instance.intentionalDisconnect === true;
        
        // APENAS RECONECTAR em casos legitimos (restart, rede, etc)
        const shouldReconnect = !isLoggedOut && !isConflict && !isIntentionalDisconnect;
        
        console.log(`${logPrefix} Analise de reconexao:`, {
          disconnectCode,
          errorMessage: errorMessage.substring(0, 50),
          isLoggedOut,
          isConflict,
          isIntentionalDisconnect, 
          shouldReconnect
        });
EOF

# 2. SUBSTITUIR LINHA PROBLEMÁTICA (173)
sed -i '173c\        // LOGICA DE RECONEXAO CORRIGIDA - APENAS EM CASOS LEGITIMOS' src/utils/connection-manager.js
sed -i '173r temp_fix_lines.txt' src/utils/connection-manager.js

# 3. LIMPAR ARQUIVO TEMPORÁRIO  
rm temp_fix_lines.txt

echo "✅ Correção aplicada com sucesso!"
echo "🔄 Próximo passo: pm2 restart whatsapp-server"