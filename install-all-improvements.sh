#!/bin/bash

# Script principal para instalar todas as melhorias no servidor WhatsApp
# Orquestra a execução dos scripts individuais

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    INSTALAÇÃO DE MELHORIAS DO SERVIDOR      ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${YELLOW}Este script irá instalar todas as melhorias no servidor WhatsApp.${NC}"
echo -e "${YELLOW}Serão executados os seguintes scripts:${NC}"
echo -e "1. ${GREEN}install-nginx-proxy.sh${NC} - Instalar Nginx como proxy reverso com SSL"
echo -e "2. ${GREEN}configure-firewall.sh${NC} - Configurar firewall (UFW)"
echo -e "3. ${GREEN}setup-env-vars.sh${NC} - Migrar credenciais para variáveis de ambiente"
echo -e "4. ${GREEN}configure-pm2-cluster.sh${NC} - Configurar PM2 em modo cluster"
echo -e "5. ${GREEN}setup-structured-logging.sh${NC} - Implementar sistema de logs estruturado"
echo -e "6. ${GREEN}setup-auto-backup.sh${NC} - Configurar backup automático"
echo -e "7. ${GREEN}add-backup-webhook.sh${NC} - Adicionar webhook de backup para mensagens"
echo -e "8. ${GREEN}add-group-message-filter.sh${NC} - Implementar filtro para mensagens de grupos"
echo ""
echo -e "${RED}IMPORTANTE: Este script deve ser executado como root.${NC}"
echo -e "${RED}Certifique-se de ter feito backup do sistema antes de prosseguir.${NC}"
echo ""

# Verificar se é root
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}Este script deve ser executado como root${NC}" 1>&2
   exit 1
fi

# Verificar se os scripts existem
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
)

MISSING_SCRIPTS=0
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$SCRIPT_DIR/$script" ]; then
        echo -e "${RED}Script não encontrado: $script${NC}"
        MISSING_SCRIPTS=$((MISSING_SCRIPTS + 1))
    fi
done

if [ $MISSING_SCRIPTS -gt 0 ]; then
    echo -e "${RED}$MISSING_SCRIPTS scripts necessários não foram encontrados.${NC}"
    echo -e "${RED}Certifique-se de que todos os scripts estão no mesmo diretório deste script.${NC}"
    exit 1
fi

# Tornar todos os scripts executáveis
echo -e "${YELLOW}Tornando todos os scripts executáveis...${NC}"
chmod +x "$SCRIPT_DIR"/*.sh

# Confirmar instalação
echo -e "${YELLOW}Deseja prosseguir com a instalação de todas as melhorias? (s/n): ${NC}"
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Instalação cancelada.${NC}"
    exit 0
fi

# Função para executar um script e verificar o resultado
run_script() {
    local script_name="$1"
    local script_path="$SCRIPT_DIR/$script_name"
    
    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${BLUE}Executando: $script_name${NC}"
    echo -e "${BLUE}==============================================${NC}"
    
    bash "$script_path"
    local result=$?
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}Script $script_name executado com sucesso!${NC}"
        return 0
    else
        echo -e "${RED}Erro ao executar o script $script_name (código de saída: $result)${NC}"
        return 1
    fi
}

# Executar scripts em ordem
FAILED_SCRIPTS=()

# 1. Configurar variáveis de ambiente (primeiro para não afetar outros scripts)
echo -e "\n${YELLOW}Etapa 1/8: Migrando credenciais para variáveis de ambiente...${NC}"
if run_script "setup-env-vars.sh"; then
    echo -e "${GREEN}✓ Variáveis de ambiente configuradas com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao configurar variáveis de ambiente.${NC}"
    FAILED_SCRIPTS+=("setup-env-vars.sh")
fi

# 2. Instalar Nginx como proxy reverso
echo -e "\n${YELLOW}Etapa 2/8: Instalando Nginx como proxy reverso...${NC}"
if run_script "install-nginx-proxy.sh"; then
    echo -e "${GREEN}✓ Nginx instalado e configurado com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao instalar Nginx.${NC}"
    FAILED_SCRIPTS+=("install-nginx-proxy.sh")
fi

# 3. Configurar firewall
echo -e "\n${YELLOW}Etapa 3/8: Configurando firewall...${NC}"
if run_script "configure-firewall.sh"; then
    echo -e "${GREEN}✓ Firewall configurado com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao configurar firewall.${NC}"
    FAILED_SCRIPTS+=("configure-firewall.sh")
fi

# 4. Configurar sistema de logs estruturado
echo -e "\n${YELLOW}Etapa 4/8: Implementando sistema de logs estruturado...${NC}"
if run_script "setup-structured-logging.sh"; then
    echo -e "${GREEN}✓ Sistema de logs estruturado implementado com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao implementar sistema de logs.${NC}"
    FAILED_SCRIPTS+=("setup-structured-logging.sh")
fi

# 5. Configurar PM2 em modo cluster
echo -e "\n${YELLOW}Etapa 5/8: Configurando PM2 em modo cluster...${NC}"
if run_script "configure-pm2-cluster.sh"; then
    echo -e "${GREEN}✓ PM2 configurado em modo cluster com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao configurar PM2.${NC}"
    FAILED_SCRIPTS+=("configure-pm2-cluster.sh")
fi

# 6. Configurar backup automático
echo -e "\n${YELLOW}Etapa 6/8: Configurando backup automático...${NC}"
if run_script "setup-auto-backup.sh"; then
    echo -e "${GREEN}✓ Backup automático configurado com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao configurar backup automático.${NC}"
    FAILED_SCRIPTS+=("setup-auto-backup.sh")
fi

# 7. Adicionar webhook de backup para mensagens
echo -e "\n${YELLOW}Etapa 7/8: Adicionando webhook de backup para mensagens...${NC}"
if run_script "add-backup-webhook.sh"; then
    echo -e "${GREEN}✓ Webhook de backup adicionado com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao adicionar webhook de backup.${NC}"
    FAILED_SCRIPTS+=("add-backup-webhook.sh")
fi

# 8. Implementar filtro para mensagens de grupos
echo -e "\n${YELLOW}Etapa 8/8: Implementando filtro para mensagens de grupos...${NC}"
if run_script "add-group-message-filter.sh"; then
    echo -e "${GREEN}✓ Filtro para mensagens de grupos implementado com sucesso!${NC}"
else
    echo -e "${RED}✗ Falha ao implementar filtro para mensagens de grupos.${NC}"
    FAILED_SCRIPTS+=("add-group-message-filter.sh")
fi

# Resumo da instalação
echo -e "\n${BLUE}==============================================${NC}"
echo -e "${BLUE}           RESUMO DA INSTALAÇÃO              ${NC}"
echo -e "${BLUE}==============================================${NC}"

if [ ${#FAILED_SCRIPTS[@]} -eq 0 ]; then
    echo -e "${GREEN}Todas as melhorias foram instaladas com sucesso!${NC}"
else
    echo -e "${RED}Alguns scripts falharam durante a instalação:${NC}"
    for script in "${FAILED_SCRIPTS[@]}"; do
        echo -e "${RED}  - $script${NC}"
    done
    echo -e "${YELLOW}Você pode tentar executar esses scripts individualmente para resolver os problemas.${NC}"
fi

echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "1. Verificar se o Nginx está funcionando corretamente: ${GREEN}systemctl status nginx${NC}"
echo -e "2. Verificar se o firewall está ativo: ${GREEN}ufw status${NC}"
echo -e "3. Verificar se o PM2 está rodando em modo cluster: ${GREEN}pm2 status${NC}"
echo -e "4. Verificar os logs do sistema: ${GREEN}tail -f /root/whatsapp-servver/logs/whatsapp-*.log${NC}"
echo -e "5. Verificar se o backup automático está configurado: ${GREEN}crontab -l${NC}"

echo -e "\n${GREEN}Obrigado por melhorar a segurança e performance do seu servidor WhatsApp!${NC}" 