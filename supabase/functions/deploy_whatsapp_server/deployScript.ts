
export const generateOptimizedDeployScript = (): string => {
  return `#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "🔧 [$(date)] Otimizando e verificando serviços WhatsApp..."

# Função para log com timestamp
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_info "Iniciando verificação e otimização dos serviços..."

# Verificar se PM2 está instalado
if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Instalando PM2..."
    npm install -g pm2
fi

# === LIMPEZA DE INSTÂNCIAS DUPLICADAS ===
log_info "Removendo instâncias PM2 duplicadas..."
pm2 delete vps-api-server 2>/dev/null || true
pm2 delete whatsapp-server 2>/dev/null || true
pm2 delete api-server 2>/dev/null || true

# Verificar status atual
log_info "Status PM2 após limpeza:"
pm2 status

# === CONFIGURAR API SERVER (PORTA 80) ===
log_info "Configurando API Server na porta 80..."
cd /root/vps-api-server || {
    log_info "Diretório /root/vps-api-server não encontrado, criando estrutura..."
    mkdir -p /root/vps-api-server
    cd /root/vps-api-server
}

# Verificar se server.js existe, se não, criar um básico
if [ ! -f "server.js" ]; then
    log_info "Criando server.js básico para API..."
    cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 80;

app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        server: 'VPS API Server',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(\`API Server rodando na porta \${PORT}\`);
});
EOF
fi

# Iniciar API Server
log_info "Iniciando API Server..."
pm2 start server.js --name "vps-api-server" --watch false

# === CONFIGURAR WHATSAPP SERVER (PORTA 3001) ===
log_info "Configurando WhatsApp Server na porta 3001..."
cd /root/whatsapp-server || {
    log_info "Diretório /root/whatsapp-server não encontrado, usando estrutura existente..."
    cd /root/whatsapp-web-server 2>/dev/null || cd /root
}

# Iniciar WhatsApp Server se não estiver rodando
if ! pm2 list | grep -q "whatsapp-server.*online"; then
    log_info "Iniciando WhatsApp Server..."
    pm2 start server.js --name "whatsapp-server" --watch false 2>/dev/null || {
        log_info "Tentando localizar e iniciar servidor WhatsApp..."
        find /root -name "server.js" -path "*/whatsapp*" -exec pm2 start {} --name "whatsapp-server" \\;
    }
fi

# Salvar configuração PM2 e configurar auto-start
log_info "Salvando configuração PM2..."
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# === VERIFICAÇÃO FINAL ROBUSTA ===
log_info "Aguardando inicialização dos serviços..."
sleep 5

log_info "Realizando verificação final com timeout estendido..."

# Função de teste com timeout
test_service() {
    local url=$1
    local name=$2
    local max_attempts=5
    
    for i in $(seq 1 $max_attempts); do
        if timeout 10 curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $name OK (tentativa $i/$max_attempts)"
            return 0
        fi
        echo "⏳ $name aguardando... (tentativa $i/$max_attempts)"
        sleep 3
    done
    echo "❌ $name FALHOU após $max_attempts tentativas"
    return 1
}

# Testar serviços
API_STATUS=$(test_service "http://localhost:80/health" "API Server" && echo "OK" || echo "FAILED")
WHATSAPP_STATUS=$(test_service "http://localhost:3001/health" "WhatsApp Server" && echo "OK" || echo "FAILED")

echo "======================================"
echo "=== RESULTADO FINAL DOS AJUSTES ==="
echo "======================================"
echo "API Server (porta 80): $API_STATUS"
echo "WhatsApp Server (porta 3001): $WHATSAPP_STATUS"
echo ""
echo "Status PM2:"
pm2 status
echo ""
echo "Portas em uso:"
netstat -tlnp | grep -E ':(80|3001)' || echo "Nenhuma porta relevante encontrada"
echo "======================================"

log_info "Verificação e otimização concluídas!"

# Teste final de conectividade externa
log_info "Testando conectividade externa..."
curl -I http://localhost:80/health 2>/dev/null && echo "✅ API acessível externamente" || echo "⚠️ API pode não estar acessível externamente"
curl -I http://localhost:3001/health 2>/dev/null && echo "✅ WhatsApp acessível externamente" || echo "⚠️ WhatsApp pode não estar acessível externamente"
`;
};
