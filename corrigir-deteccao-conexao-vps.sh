#!/bin/bash

# 🔗 CORRIGIR DETECÇÃO DE CONEXÃO WHATSAPP NA VPS
# Corrige timeout e seletores para detectar conexão corretamente

echo "🔗 Corrigindo detecção de conexão WhatsApp na VPS..."

# Encontrar arquivo do servidor
SERVER_FILE=""
for file in puppeteer-import-server.js server.js index.js app.js; do
    if [ -f "$file" ]; then
        SERVER_FILE="$file"
        break
    fi
done

if [ -z "$SERVER_FILE" ]; then
    echo "❌ Arquivo do servidor não encontrado!"
    exit 1
fi

echo "📁 Arquivo encontrado: $SERVER_FILE"

# Backup
cp "$SERVER_FILE" "${SERVER_FILE}.backup-conexao-$(date +%Y%m%d_%H%M%S)"

# Substituir função waitForWhatsAppConnection
echo "🔄 Substituindo função de detecção de conexão..."

# Criar arquivo temporário com nova função
cat > temp_new_connection_function.js << 'EOF'

// 🔗 Aguardar conexão do WhatsApp COM DETECÇÃO ROBUSTA
async function waitForWhatsAppConnection(sessionId, page) {
    console.log(`🔗 [${sessionId}] Aguardando escaneamento do QR Code...`);

    try {
        console.log(`🔗 [${sessionId}] Iniciando detecção robusta de conexão...`);
        
        // 🆕 MÚLTIPLOS SELETORES para detectar conexão
        const connectionSelectors = [
            '[data-testid="chat"]',              // Seletor original
            '[data-testid="chats-container"]',   // Container de chats
            '[data-testid="conversation-header"]', // Header de conversa
            '[aria-label*="Conversas"]',         // Aria label conversas
            '[title*="WhatsApp"]',               // Title WhatsApp
            '.two',                              // Classe principal
            '#pane-side',                        // Painel lateral
            '[data-testid="intro-md-beta-logo-dark"]' // Logo escuro
        ];

        console.log(`🔗 [${sessionId}] Testando ${connectionSelectors.length} seletores diferentes...`);

        // 🆕 TIMEOUT AUMENTADO para 10 minutos
        const connectionTimeout = 600000; // 10 minutos em ms
        
        // 🆕 POLLING COM MÚLTIPLOS SELETORES
        let connected = false;
        let attempts = 0;
        const maxAttempts = 200; // 200 x 3s = 10 minutos
        
        while (!connected && attempts < maxAttempts) {
            attempts++;
            
            try {
                // Verificar se QR Code ainda existe (se sumir = conectou)
                const qrExists = await page.$('[data-ref] canvas').catch(() => null);
                
                if (!qrExists) {
                    console.log(`🔗 [${sessionId}] QR Code desapareceu - provável conexão!`);
                    
                    // Aguardar um pouco para página carregar
                    await page.waitForTimeout(5000);
                    
                    // Testar múltiplos seletores
                    for (const selector of connectionSelectors) {
                        try {
                            const element = await page.$(selector);
                            if (element) {
                                console.log(`✅ [${sessionId}] WhatsApp conectado! Detectado via: ${selector}`);
                                connected = true;
                                break;
                            }
                        } catch (selectorError) {
                            // Ignorar erros de seletor específico
                        }
                    }
                }
                
                if (!connected) {
                    // Log de progresso a cada 10 tentativas
                    if (attempts % 10 === 0) {
                        console.log(`🔗 [${sessionId}] Tentativa ${attempts}/${maxAttempts} - aguardando conexão...`);
                    }
                    
                    await page.waitForTimeout(3000); // Aguardar 3 segundos
                }
                
            } catch (pollError) {
                console.log(`🔗 [${sessionId}] Erro no polling ${attempts}: ${pollError.message}`);
                await page.waitForTimeout(3000);
            }
        }

        if (connected) {
            console.log(`✅ [${sessionId}] WhatsApp conectado após ${attempts} tentativas!`);
            
            sessions.set(sessionId, {
                ...sessions.get(sessionId),
                status: 'connected',
                message: 'WhatsApp conectado - iniciando importação automática...',
                connectedAt: new Date().toISOString(),
                connectionMethod: 'robust_polling'
            });

            // 🚀 AUTOMATIZAR IMPORTAÇÃO APÓS CONEXÃO
            console.log(`🚀 [${sessionId}] Iniciando importação automática do histórico...`);
            
            // Aguardar um pouco para garantir que a conexão está estável
            await page.waitForTimeout(5000);
            
            // Iniciar importação automaticamente
            await importWhatsAppHistory(sessionId);

        } else {
            throw new Error(`Timeout após ${attempts} tentativas (${Math.round(attempts * 3 / 60)} minutos)`);
        }

    } catch (error) {
        console.log(`❌ [${sessionId}] Timeout na conexão: ${error.message}`);
        sessions.set(sessionId, {
            ...sessions.get(sessionId),
            status: 'connection_timeout',
            message: `Timeout - QR Code não foi escaneado (${error.message})`
        });
    }
}

EOF

# Substituir função no arquivo principal
echo "📝 Substituindo função no arquivo..."

# Fazer backup da função antiga
sed -n '/async function waitForWhatsAppConnection/,/^}/p' "$SERVER_FILE" > "old_waitForWhatsAppConnection_backup.js"

# Encontrar linha de início e fim da função
START_LINE=$(grep -n "async function waitForWhatsAppConnection" "$SERVER_FILE" | cut -d: -f1)
END_LINE=$(sed -n "${START_LINE},\$p" "$SERVER_FILE" | grep -n "^}" | head -1 | cut -d: -f1)
END_LINE=$((START_LINE + END_LINE - 1))

if [ -n "$START_LINE" ] && [ -n "$END_LINE" ]; then
    echo "📍 Função encontrada nas linhas $START_LINE-$END_LINE"
    
    # Criar arquivo temporário com substituição
    head -n $((START_LINE - 1)) "$SERVER_FILE" > temp_server.js
    cat temp_new_connection_function.js >> temp_server.js
    tail -n +$((END_LINE + 1)) "$SERVER_FILE" >> temp_server.js
    
    # Substituir arquivo original
    mv temp_server.js "$SERVER_FILE"
    
    echo "✅ Função waitForWhatsAppConnection substituída!"
else
    echo "❌ Função waitForWhatsAppConnection não encontrada!"
    echo "📋 Adicionando nova função no final do arquivo..."
    cat temp_new_connection_function.js >> "$SERVER_FILE"
fi

# Limpeza
rm -f temp_new_connection_function.js

echo ""
echo "✅ Detecção de conexão corrigida!"
echo ""
echo "🔄 Reinicie o servidor VPS:"
echo "   pm2 restart all"
echo ""
echo "📋 Melhorias aplicadas:"
echo "   - Timeout aumentado para 10 minutos"
echo "   - 8 seletores diferentes para detectar conexão"
echo "   - Polling inteligente (verifica se QR sumiu)"
echo "   - Logs de progresso a cada 30 segundos"
echo "   - Detecção mais robusta" 