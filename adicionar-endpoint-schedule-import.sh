#!/bin/bash

# 🎯 ADICIONAR ENDPOINT /schedule-import NA VPS
# Adiciona endpoint simples para evitar erro 404 do frontend
# A lógica de importação automática já existe em waitForWhatsAppConnection()

echo "🔧 Adicionando endpoint /schedule-import na VPS..."

# Encontrar arquivo do servidor Puppeteer
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

echo "📁 Servidor encontrado: $SERVER_FILE"

# Backup
cp "$SERVER_FILE" "${SERVER_FILE}.backup-$(date +%Y%m%d_%H%M%S)"

# Adicionar endpoint antes do último "});"
cat >> "$SERVER_FILE" << 'EOF'

// 📅 ENDPOINT: Agendar importação (COMPATIBILIDADE FRONTEND)
app.post('/schedule-import', authenticate, (req, res) => {
    try {
        const { sessionId, instanceId, webhookUrl, userId, waitForConnection, autoImportOnConnect } = req.body;
        
        console.log(`📅 [Schedule Import] Importação agendada recebida:`, {
            sessionId,
            instanceId,
            userId,
            waitForConnection,
            autoImportOnConnect
        });

        // ✅ A importação já acontece automaticamente em waitForWhatsAppConnection()
        // Este endpoint só registra a intenção para compatibilidade com frontend
        
        const session = sessions.get(sessionId);
        if (session) {
            // Marcar que importação foi solicitada
            session.importRequested = true;
            session.importRequestedAt = new Date().toISOString();
            session.userId = userId;
            session.autoImportOnConnect = autoImportOnConnect;
            
            console.log(`📅 [Schedule Import] ✅ Importação marcada para sessão: ${sessionId}`);
        }

        res.json({
            success: true,
            message: 'Importação agendada - executará automaticamente quando WhatsApp conectar',
            sessionId,
            instanceId,
            autoImportEnabled: true,
            scheduledAt: new Date().toISOString()
        });

    } catch (error) {
        console.error(`📅 [Schedule Import] ❌ Erro:`, error);
        res.status(500).json({
            success: false,
            error: 'Erro ao agendar importação',
            message: error.message
        });
    }
});

EOF

echo "✅ Endpoint /schedule-import adicionado!"
echo ""
echo "🔄 Reinicie o servidor VPS:"
echo "   pm2 restart all"
echo ""
echo "📋 O que foi adicionado:"
echo "   - Endpoint POST /schedule-import"
echo "   - Compatibilidade com chamadas do frontend"
echo "   - Log das solicitações de importação"
echo "   - A importação continua automática em waitForWhatsAppConnection()" 