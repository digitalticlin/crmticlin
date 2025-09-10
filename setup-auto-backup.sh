#!/bin/bash

# Script para configurar backup automático dos dados do servidor WhatsApp
# Faz backup de arquivos importantes e os comprime

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando Backup Automático ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Criar diretório de backups"
echo "2. Configurar script de backup diário"
echo "3. Configurar rotação de backups (manter últimos 7 dias)"
echo "4. Adicionar tarefa cron para execução automática"
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

# Criar diretório de backups
BACKUP_DIR="$WHATSAPP_DIR/backups"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}Diretório de backups criado: $BACKUP_DIR${NC}"

# Criar script de backup
BACKUP_SCRIPT="$WHATSAPP_DIR/backup.sh"
echo -e "${GREEN}Criando script de backup...${NC}"

cat > "$BACKUP_SCRIPT" << 'EOF'
#!/bin/bash

# Script de backup para o servidor WhatsApp
# Faz backup de arquivos importantes e os comprime

# Definir diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/whatsapp_backup_$DATE.tar.gz"

# Verificar se o diretório de backups existe
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

# Arquivos a serem incluídos no backup
echo "Iniciando backup em $DATE..."
echo "Criando arquivo $BACKUP_FILE..."

# Criar backup
tar -czf "$BACKUP_FILE" \
    --exclude="node_modules" \
    --exclude="logs/*.log" \
    --exclude="backups" \
    -C "$SCRIPT_DIR" \
    store.json \
    instances.json \
    auth_info \
    .env \
    ecosystem.config.js \
    ecosystem.cluster.js \
    serverjs-atual \
    server.js \
    logger.js

# Verificar se o backup foi criado com sucesso
if [ $? -eq 0 ]; then
    echo "Backup criado com sucesso: $BACKUP_FILE"
    
    # Calcular tamanho do backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Tamanho do backup: $BACKUP_SIZE"
    
    # Remover backups antigos (manter apenas os últimos 7)
    echo "Removendo backups antigos..."
    ls -tp "$BACKUP_DIR"/whatsapp_backup_*.tar.gz | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}
    
    echo "Backup concluído com sucesso!"
else
    echo "Erro ao criar backup!"
    exit 1
fi

# Listar backups disponíveis
echo "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/whatsapp_backup_*.tar.gz | sort -r
EOF

# Tornar o script executável
chmod +x "$BACKUP_SCRIPT"
echo -e "${GREEN}Script de backup criado em $BACKUP_SCRIPT${NC}"

# Criar script de restauração
RESTORE_SCRIPT="$WHATSAPP_DIR/restore.sh"
echo -e "${GREEN}Criando script de restauração...${NC}"

cat > "$RESTORE_SCRIPT" << 'EOF'
#!/bin/bash

# Script de restauração para o servidor WhatsApp
# Restaura um backup previamente criado

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Definir diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Verificar se o diretório de backups existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Diretório de backups não encontrado: $BACKUP_DIR${NC}"
    exit 1
fi

# Listar backups disponíveis
echo -e "${GREEN}Backups disponíveis:${NC}"
BACKUPS=($(ls -t "$BACKUP_DIR"/whatsapp_backup_*.tar.gz 2>/dev/null))

if [ ${#BACKUPS[@]} -eq 0 ]; then
    echo -e "${RED}Nenhum backup encontrado em $BACKUP_DIR${NC}"
    exit 1
fi

# Mostrar lista numerada de backups
for i in "${!BACKUPS[@]}"; do
    BACKUP_FILE="${BACKUPS[$i]}"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    BACKUP_DATE=$(echo "$BACKUP_FILE" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
    echo -e "$i) $(basename "$BACKUP_FILE") - $BACKUP_SIZE - $BACKUP_DATE"
done

# Solicitar seleção do backup
read -p "Digite o número do backup que deseja restaurar: " BACKUP_NUM

if ! [[ "$BACKUP_NUM" =~ ^[0-9]+$ ]] || [ "$BACKUP_NUM" -ge ${#BACKUPS[@]} ]; then
    echo -e "${RED}Seleção inválida!${NC}"
    exit 1
fi

SELECTED_BACKUP="${BACKUPS[$BACKUP_NUM]}"
echo -e "${YELLOW}Você selecionou: $(basename "$SELECTED_BACKUP")${NC}"

# Confirmar restauração
read -p "ATENÇÃO: A restauração irá substituir os arquivos atuais. Continuar? (s/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Restauração cancelada.${NC}"
    exit 0
fi

# Parar o servidor
echo -e "${YELLOW}Parando o servidor...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop all
fi

# Criar backup dos arquivos atuais antes da restauração
TEMP_BACKUP="$BACKUP_DIR/pre_restore_backup_$(date +"%Y%m%d_%H%M%S").tar.gz"
echo -e "${YELLOW}Criando backup dos arquivos atuais em $TEMP_BACKUP...${NC}"

tar -czf "$TEMP_BACKUP" \
    --exclude="node_modules" \
    --exclude="logs/*.log" \
    --exclude="backups" \
    -C "$SCRIPT_DIR" \
    store.json \
    instances.json \
    auth_info \
    .env \
    ecosystem.config.js \
    ecosystem.cluster.js \
    serverjs-atual \
    server.js \
    logger.js

# Restaurar o backup selecionado
echo -e "${GREEN}Restaurando backup...${NC}"
tar -xzf "$SELECTED_BACKUP" -C "$SCRIPT_DIR"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backup restaurado com sucesso!${NC}"
    
    # Reiniciar o servidor
    echo -e "${YELLOW}Reiniciando o servidor...${NC}"
    if command -v pm2 &> /dev/null; then
        cd "$SCRIPT_DIR"
        if [ -f "$SCRIPT_DIR/ecosystem.cluster.js" ]; then
            pm2 start ecosystem.cluster.js
        elif [ -f "$SCRIPT_DIR/ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js
        else
            pm2 start serverjs-atual
        fi
        echo -e "${GREEN}Servidor reiniciado.${NC}"
    else
        echo -e "${YELLOW}PM2 não encontrado. Reinicie o servidor manualmente.${NC}"
    fi
else
    echo -e "${RED}Erro ao restaurar backup!${NC}"
    echo -e "${YELLOW}Restaurando arquivos originais...${NC}"
    tar -xzf "$TEMP_BACKUP" -C "$SCRIPT_DIR"
    exit 1
fi

echo -e "${GREEN}Processo de restauração concluído!${NC}"
EOF

# Tornar o script executável
chmod +x "$RESTORE_SCRIPT"
echo -e "${GREEN}Script de restauração criado em $RESTORE_SCRIPT${NC}"

# Configurar cron para backup automático diário
echo -e "${GREEN}Configurando backup automático diário...${NC}"
CRON_JOB="0 2 * * * $BACKUP_SCRIPT > $WHATSAPP_DIR/logs/backup.log 2>&1"

# Verificar se o cron job já existe
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo -e "${YELLOW}Tarefa cron para backup já existe. Pulando.${NC}"
else
    # Adicionar ao crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}Tarefa cron adicionada. Backup será executado diariamente às 2h da manhã.${NC}"
fi

# Executar backup inicial
echo -e "${YELLOW}Deseja executar um backup inicial agora? (s/n): ${NC}"
read -r EXECUTE_BACKUP

if [[ "$EXECUTE_BACKUP" =~ ^[Ss]$ ]]; then
    echo -e "${GREEN}Executando backup inicial...${NC}"
    bash "$BACKUP_SCRIPT"
else
    echo -e "${YELLOW}Backup inicial não será executado. Próximo backup será feito automaticamente conforme agendamento.${NC}"
fi

echo -e "${GREEN}=== Configuração de Backup Automático Concluída! ===${NC}"
echo -e "${YELLOW}Backups serão salvos em: $BACKUP_DIR${NC}"
echo -e "${YELLOW}Para executar um backup manualmente:${NC}"
echo -e "bash $BACKUP_SCRIPT"
echo -e ""
echo -e "${YELLOW}Para restaurar um backup:${NC}"
echo -e "bash $RESTORE_SCRIPT"
echo -e ""
echo -e "${RED}IMPORTANTE: Teste o processo de backup e restauração em um ambiente de teste antes de confiar nele.${NC}" 