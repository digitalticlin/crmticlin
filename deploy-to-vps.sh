#!/bin/bash

# Script para transferir todos os scripts de melhoria para a VPS
# Transfere os arquivos via SCP e prepara para execução

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    TRANSFERÊNCIA DE SCRIPTS PARA A VPS      ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Solicitar informações da VPS
read -p "Digite o endereço IP da VPS: " VPS_IP
read -p "Digite o usuário SSH (geralmente 'root'): " SSH_USER
read -p "Digite a porta SSH (padrão: 22): " SSH_PORT

# Usar porta padrão se não informada
SSH_PORT=${SSH_PORT:-22}

# Verificar se os arquivos necessários existem
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIRED_SCRIPTS=(
    "install-nginx-proxy.sh"
    "configure-firewall.sh"
    "setup-env-vars.sh"
    "configure-pm2-cluster.sh"
    "setup-structured-logging.sh"
    "setup-auto-backup.sh"
    "add-backup-webhook.sh"
    "add-group-message-filter.sh"
    "install-all-improvements.sh"
    "pre-install-backup.sh"
    "post-install-check.sh"
    "README.md"
)

MISSING_SCRIPTS=0
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$script" ]; then
        echo -e "${RED}Script não encontrado: $script${NC}"
        MISSING_SCRIPTS=$((MISSING_SCRIPTS + 1))
    fi
done

if [ $MISSING_SCRIPTS -gt 0 ]; then
    echo -e "${RED}$MISSING_SCRIPTS arquivos necessários não foram encontrados.${NC}"
    echo -e "${RED}Certifique-se de que todos os arquivos estão no mesmo diretório deste script.${NC}"
    exit 1
fi

# Criar diretório temporário para arquivos
TEMP_DIR=$(mktemp -d)
echo -e "${GREEN}Criando pacote de arquivos em $TEMP_DIR...${NC}"

# Copiar todos os scripts para o diretório temporário
cp "$SCRIPT_DIR"/*.sh "$TEMP_DIR"/
cp "$SCRIPT_DIR/README.md" "$TEMP_DIR"/

# Tornar todos os scripts executáveis
chmod +x "$TEMP_DIR"/*.sh

# Criar arquivo de verificação
echo "# Script de verificação" > "$TEMP_DIR/check.sh"
echo "echo \"Scripts de melhoria transferidos com sucesso!\"" >> "$TEMP_DIR/check.sh"
echo "echo \"Execute ./install-all-improvements.sh para iniciar a instalação.\"" >> "$TEMP_DIR/check.sh"
chmod +x "$TEMP_DIR/check.sh"

# Transferir arquivos para a VPS
echo -e "${GREEN}Transferindo arquivos para a VPS...${NC}"
echo -e "${YELLOW}Isso pode levar alguns segundos...${NC}"

# Criar diretório na VPS
ssh -p "$SSH_PORT" "$SSH_USER@$VPS_IP" "mkdir -p /root/whatsapp-improvements"

# Transferir arquivos
scp -P "$SSH_PORT" "$TEMP_DIR"/* "$SSH_USER@$VPS_IP:/root/whatsapp-improvements/"

# Verificar se a transferência foi bem-sucedida
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Arquivos transferidos com sucesso!${NC}"
    
    # Executar verificação remota
    echo -e "${GREEN}Verificando transferência...${NC}"
    ssh -p "$SSH_PORT" "$SSH_USER@$VPS_IP" "cd /root/whatsapp-improvements && ./check.sh"
    
    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${GREEN}Próximos passos:${NC}"
    echo -e "1. Conecte-se à VPS: ${YELLOW}ssh -p $SSH_PORT $SSH_USER@$VPS_IP${NC}"
    echo -e "2. Navegue até o diretório: ${YELLOW}cd /root/whatsapp-improvements${NC}"
    echo -e "3. Faça um backup do sistema: ${YELLOW}./pre-install-backup.sh${NC}"
    echo -e "4. Execute o script principal: ${YELLOW}./install-all-improvements.sh${NC}"
    echo -e "5. Verifique a instalação: ${YELLOW}./post-install-check.sh${NC}"
    echo -e "\n${RED}IMPORTANTE: Faça backup do sistema antes de executar os scripts!${NC}"
else
    echo -e "${RED}Falha ao transferir arquivos para a VPS.${NC}"
    echo -e "${YELLOW}Verifique as credenciais e tente novamente.${NC}"
fi

# Limpar diretório temporário
rm -rf "$TEMP_DIR"
echo -e "${BLUE}==============================================${NC}" 