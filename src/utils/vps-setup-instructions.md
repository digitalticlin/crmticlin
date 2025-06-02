
# Instruções de Instalação do VPS API Server

## 1. Conectar na VPS via SSH
```bash
ssh root@31.97.24.222
```

## 2. Instalar Node.js (se não estiver instalado)
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 3. Criar diretório para o API Server
```bash
mkdir -p /root/vps-api-server
cd /root/vps-api-server
```

## 4. Criar arquivo package.json
```bash
cat > package.json << 'EOF'
{
  "name": "vps-api-server",
  "version": "1.0.0",
  "description": "API Server para controle remoto da VPS",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF
```

## 5. Copiar o código do servidor
Copie o conteúdo do arquivo `vps-api-server.js` para o arquivo `server.js`:

```bash
# Cole o código aqui ou transfira o arquivo
nano server.js
# (Cole o código do vps-api-server.js)
```

## 6. Instalar dependências
```bash
npm install
```

## 7. Configurar variáveis de ambiente (opcional)
```bash
# Criar arquivo .env para configurações
cat > .env << 'EOF'
API_PORT=3002
VPS_API_TOKEN=meu-token-seguro-123
EOF
```

## 8. Testar o servidor
```bash
# Executar em primeiro plano para teste
node server.js
```

## 9. Configurar para rodar em background (PM2)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar servidor com PM2
pm2 start server.js --name "vps-api-server"

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

## 10. Verificar se está funcionando
```bash
# Testar localmente
curl http://localhost:3002/status

# Verificar logs
pm2 logs vps-api-server
```

## 11. Configurar firewall (se necessário)
```bash
# Permitir porta 3002
ufw allow 3002

# Verificar status do firewall
ufw status
```

## Comandos úteis:
```bash
# Ver status dos processos PM2
pm2 list

# Reiniciar o API server
pm2 restart vps-api-server

# Parar o API server
pm2 stop vps-api-server

# Ver logs em tempo real
pm2 logs vps-api-server --lines 50

# Testar endpoint de execução (com curl)
curl -X POST http://localhost:3002/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer default-token" \
  -d '{"command":"echo 'Hello World'","description":"Teste"}'
```

## Estrutura final:
```
/root/vps-api-server/
├── server.js          # Código do API server
├── package.json       # Dependências
├── .env              # Configurações (opcional)
└── node_modules/     # Dependências instaladas
```

## Próximos passos:
1. Após instalar e configurar o API server na VPS
2. Teste a conexão usando o painel administrativo
3. Execute as correções automáticas via o botão "Aplicar Correções SSH"
