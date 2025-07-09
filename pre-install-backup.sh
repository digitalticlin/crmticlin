#!/bin/bash

# Script para fazer backup do sistema antes de aplicar as melhorias
# Cria um backup completo do diretório do servidor WhatsApp

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    BACKUP PRÉ-INSTALAÇÃO DO SERVIDOR        ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${YELLOW}Este script irá criar um backup completo do servidor WhatsApp antes de aplicar as melhorias.${NC}"
echo -e "${YELLOW}É altamente recomendado executar este script antes de qualquer modificação.${NC}"
echo ""

# Verificar se é root
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}Este script deve ser executado como root${NC}" 1>&2
   exit 1
fi

# Definir o diretório do servidor WhatsApp
WHATSAPP_DIR="/root/whatsapp-servver"

# Verificar se o diretório existe
if [ ! -d "$WHATSAPP_DIR" ]; then
    echo -e "${RED}O diretório $WHATSAPP_DIR não existe.${NC}"
    read -p "Digite o caminho correto para o diretório do servidor WhatsApp: " WHATSAPP_DIR
    
    if [ ! -d "$WHATSAPP_DIR" ]; then
        echo -e "${RED}Diretório inválido. Saindo.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Usando diretório: $WHATSAPP_DIR${NC}"

# Definir diretório e nome do arquivo de backup
BACKUP_DIR="/root/whatsapp-backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/whatsapp_pre_install_backup_$DATE.tar.gz"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar espaço em disco
echo -e "${YELLOW}Verificando espaço em disco...${NC}"
DISK_SPACE=$(df -h / | awk 'NR==2 {print $4}')
WHATSAPP_SIZE=$(du -sh "$WHATSAPP_DIR" | awk '{print $1}')
echo -e "Espaço disponível: ${GREEN}$DISK_SPACE${NC}"
echo -e "Tamanho do diretório a ser copiado: ${YELLOW}$WHATSAPP_SIZE${NC}"

# Confirmar backup
echo -e "${YELLOW}Deseja prosseguir com o backup? (s/n): ${NC}"
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Backup cancelado.${NC}"
    exit 0
fi

# Parar o servidor para garantir consistência do backup
echo -e "${YELLOW}Parando o servidor WhatsApp para garantir consistência do backup...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop all
    echo -e "${GREEN}Servidor parado com sucesso.${NC}"
else
    echo -e "${RED}PM2 não encontrado. Certifique-se de que o servidor está parado manualmente.${NC}"
    read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."
fi

# Criar backup
echo -e "${GREEN}Criando backup em $BACKUP_FILE...${NC}"
echo -e "${YELLOW}Isso pode levar alguns minutos, dependendo do tamanho do diretório...${NC}"

tar -czf "$BACKUP_FILE" \
    --exclude="node_modules" \
    --exclude="logs/*.log" \
    -C "$(dirname "$WHATSAPP_DIR")" \
    "$(basename "$WHATSAPP_DIR")"

# Verificar se o backup foi criado com sucesso
if [ $? -eq 0 ]; then
    # Calcular tamanho do backup
    BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | awk '{print $1}')
    
    echo -e "${GREEN}Backup criado com sucesso!${NC}"
    echo -e "Arquivo: ${YELLOW}$BACKUP_FILE${NC}"
    echo -e "Tamanho: ${YELLOW}$BACKUP_SIZE${NC}"
    
    # Criar script de restauração
    RESTORE_SCRIPT="$BACKUP_DIR/restore_pre_install_backup.sh"
    
    cat > "$RESTORE_SCRIPT" << EOF
#!/bin/bash

# Script para restaurar o backup pré-instalação
# Restaura o servidor WhatsApp para o estado anterior às melhorias

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\${GREEN}=== Restaurando Backup Pré-Instalação ===${NC}"

# Verificar se é root
if [ "\$(id -u)" != "0" ]; then
   echo -e "\${RED}Este script deve ser executado como root{NC}" 1>&2
   exit 1
fi

# Parar o servidor
echo -e "\${YELLOW}Parando o servidor...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop all
fi

# Restaurar backup
echo -e "\${GREEN}Restaurando backup de $BACKUP_FILE...${NC}"
echo -e "\${RED}ATENÇÃO: Isso substituirá completamente o diretório $WHATSAPP_DIR${NC}"
echo -e "\${RED}Todos os arquivos atuais serão perdidos!${NC}"

read -p "Deseja continuar? (s/n): " CONFIRM
if [[ ! "\$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "\${YELLOW}Restauração cancelada.${NC}"
    exit 0
fi

# Criar backup do estado atual antes da restauração
TEMP_BACKUP="/tmp/whatsapp_pre_restore_\$(date +"%Y%m%d_%H%M%S").tar.gz"
echo -e "\${YELLOW}Criando backup temporário do estado atual em \$TEMP_BACKUP...${NC}"

tar -czf "\$TEMP_BACKUP" \\
    --exclude="node_modules" \\
    --exclude="logs/*.log" \\
    -C "\$(dirname "$WHATSAPP_DIR")" \\
    "\$(basename "$WHATSAPP_DIR")"

# Remover diretório atual
echo -e "\${YELLOW}Removendo diretório atual...${NC}"
rm -rf "$WHATSAPP_DIR"

# Extrair backup
echo -e "\${GREEN}Extraindo backup...${NC}"
mkdir -p "\$(dirname "$WHATSAPP_DIR")"
tar -xzf "$BACKUP_FILE" -C "\$(dirname "$WHATSAPP_DIR")"

if [ \$? -eq 0 ]; then
    echo -e "\${GREEN}Backup restaurado com sucesso!${NC}"
    
    # Reiniciar o servidor
    echo -e "\${YELLOW}Reiniciando o servidor...${NC}"
    if command -v pm2 &> /dev/null; then
        cd "$WHATSAPP_DIR"
        pm2 start serverjs-atual
        echo -e "\${GREEN}Servidor reiniciado.${NC}"
    else
        echo -e "\${YELLOW}PM2 não encontrado. Reinicie o servidor manualmente.${NC}"
    fi
    
    echo -e "\${GREEN}=== Restauração Concluída! ===${NC}"
else
    echo -e "\${RED}Erro ao extrair backup!${NC}"
    echo -e "\${YELLOW}Restaurando estado anterior...${NC}"
    
    # Restaurar do backup temporário
    rm -rf "$WHATSAPP_DIR"
    tar -xzf "\$TEMP_BACKUP" -C "\$(dirname "$WHATSAPP_DIR")"
    
    echo -e "\${RED}Falha na restauração. Estado anterior recuperado.${NC}"
    exit 1
fi
EOF
    
    chmod +x "$RESTORE_SCRIPT"
    
    echo -e "\n${GREEN}Script de restauração criado: $RESTORE_SCRIPT${NC}"
    echo -e "${YELLOW}Use este script para restaurar o sistema em caso de problemas.${NC}"
    
    # Reiniciar o servidor
    echo -e "\n${YELLOW}Reiniciando o servidor...${NC}"
    if command -v pm2 &> /dev/null; then
        cd "$WHATSAPP_DIR"
        pm2 restart all
        echo -e "${GREEN}Servidor reiniciado.${NC}"
    else
        echo -e "${YELLOW}PM2 não encontrado. Reinicie o servidor manualmente.${NC}"
    fi
    
    echo -e "\n${BLUE}==============================================${NC}"
    echo -e "${GREEN}Backup pré-instalação concluído com sucesso!${NC}"
    echo -e "${YELLOW}Agora você pode prosseguir com a instalação das melhorias.${NC}"
    echo -e "${BLUE}==============================================${NC}"
else
    echo -e "${RED}Erro ao criar backup!${NC}"
    
    # Reiniciar o servidor
    echo -e "\n${YELLOW}Reiniciando o servidor...${NC}"
    if command -v pm2 &> /dev/null; then
        cd "$WHATSAPP_DIR"
        pm2 restart all
    fi
    
    echo -e "${RED}Falha no backup. Verifique o espaço em disco e permissões.${NC}"
    exit 1
fi 