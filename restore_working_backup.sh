#!/bin/bash

echo "=== Restaurando backup funcional do servidor WhatsApp ==="

# Definir diretório do servidor
SERVER_DIR="/root/whatsapp-server"
SERVER_JS="$SERVER_DIR/server.js"
BACKUP_FILE="$SERVER_DIR/server.js.backup-perfeito-1750870073801"

# Verificar se o backup existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup não encontrado: $BACKUP_FILE"
  exit 1
fi

# Criar backup do arquivo atual
CURRENT_BACKUP="$SERVER_JS.backup.$(date +%Y%m%d_%H%M%S)"
echo "Criando backup do arquivo atual em: $CURRENT_BACKUP"
cp "$SERVER_JS" "$CURRENT_BACKUP"

# Restaurar o backup
echo "Restaurando backup funcional..."
cp "$BACKUP_FILE" "$SERVER_JS"

echo "Backup restaurado com sucesso!"
echo "Reiniciando o servidor..."
cd "$SERVER_DIR" && pm2 restart all

echo "Aguardando inicialização do servidor (10s)..."
sleep 10

echo "Verificando status do servidor:"
curl -s http://localhost:3002/health

echo ""
echo "Teste concluído! Agora você pode tentar criar uma nova instância." 