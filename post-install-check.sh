#!/bin/bash

# Script de verificação pós-instalação
# Verifica se todas as melhorias foram aplicadas corretamente

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    VERIFICAÇÃO PÓS-INSTALAÇÃO              ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${YELLOW}Este script verifica se todas as melhorias foram aplicadas corretamente.${NC}"
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

# Inicializar contadores
PASSED=0
FAILED=0
WARNINGS=0

# Função para verificar e imprimir resultado
check_item() {
    local description="$1"
    local command="$2"
    local expected_status="$3"
    local severity="$4"  # "critical" ou "warning"
    
    echo -ne "${YELLOW}Verificando $description... ${NC}"
    
    eval "$command" > /tmp/check_result 2>&1
    local status=$?
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        if [ "$severity" == "critical" ]; then
            echo -e "${RED}✗ FALHA${NC}"
            FAILED=$((FAILED + 1))
        else
            echo -e "${YELLOW}⚠️ ATENÇÃO${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        echo -e "  ${RED}Resultado:${NC}"
        cat /tmp/check_result | sed 's/^/  /'
        return 1
    fi
}

# 1. Verificar se o Nginx está instalado e rodando
echo -e "\n${BLUE}1. Verificando Nginx${NC}"
check_item "Nginx instalado" "command -v nginx" 0 "critical"
check_item "Nginx rodando" "systemctl is-active nginx" 0 "critical"
check_item "Configuração do Nginx" "nginx -t" 0 "critical"

# 2. Verificar se o firewall está configurado
echo -e "\n${BLUE}2. Verificando Firewall${NC}"
check_item "UFW instalado" "command -v ufw" 0 "critical"
check_item "UFW ativo" "ufw status | grep -q 'Status: active'" 0 "critical"
check_item "Porta 80 aberta" "ufw status | grep -q '80/tcp'" 0 "critical"
check_item "Porta 443 aberta" "ufw status | grep -q '443/tcp'" 0 "critical"
check_item "Porta 3002 bloqueada para acesso externo" "ufw status | grep -q 'DENY.*3002'" 0 "warning"

# 3. Verificar se as variáveis de ambiente estão configuradas
echo -e "\n${BLUE}3. Verificando Variáveis de Ambiente${NC}"
check_item "Arquivo .env existe" "test -f $WHATSAPP_DIR/.env" 0 "critical"
check_item "SUPABASE_PROJECT definido" "grep -q 'SUPABASE_PROJECT' $WHATSAPP_DIR/.env" 0 "critical"
check_item "SUPABASE_SERVICE_KEY definido" "grep -q 'SUPABASE_SERVICE_KEY' $WHATSAPP_DIR/.env" 0 "critical"

# 4. Verificar se o PM2 está configurado em modo cluster
echo -e "\n${BLUE}4. Verificando PM2${NC}"
check_item "PM2 instalado" "command -v pm2" 0 "critical"
check_item "Arquivo de configuração do PM2" "test -f $WHATSAPP_DIR/ecosystem.cluster.js" 0 "warning"
check_item "PM2 rodando" "pm2 status | grep -q 'online'" 0 "critical"

# 5. Verificar se o sistema de logs está configurado
echo -e "\n${BLUE}5. Verificando Sistema de Logs${NC}"
check_item "Winston instalado" "cd $WHATSAPP_DIR && npm list winston | grep -q 'winston'" 0 "warning"
check_item "Diretório de logs existe" "test -d $WHATSAPP_DIR/logs" 0 "warning"
check_item "Arquivo de configuração do logger" "test -f $WHATSAPP_DIR/logger.js" 0 "warning"

# 6. Verificar se o backup automático está configurado
echo -e "\n${BLUE}6. Verificando Backup Automático${NC}"
check_item "Script de backup existe" "test -f $WHATSAPP_DIR/backup.sh" 0 "warning"
check_item "Script de backup é executável" "test -x $WHATSAPP_DIR/backup.sh" 0 "warning"
check_item "Tarefa cron configurada" "crontab -l | grep -q 'backup.sh'" 0 "warning"

# 7. Verificar se o webhook de backup está configurado
echo -e "\n${BLUE}7. Verificando Webhook de Backup${NC}"
check_item "Webhook de backup configurado" "grep -q 'MESSAGE_BACKUP' $WHATSAPP_DIR/serverjs-atual" 0 "warning"

# 8. Verificar se o filtro de mensagens de grupos está configurado
echo -e "\n${BLUE}8. Verificando Filtro de Mensagens de Grupos${NC}"
check_item "Filtro de grupos configurado" "grep -q '@g.us' $WHATSAPP_DIR/serverjs-atual" 0 "warning"

# Verificar se o servidor está respondendo
echo -e "\n${BLUE}9. Verificando Conectividade do Servidor${NC}"
check_item "Servidor respondendo localmente" "curl -s http://localhost:3002/ping > /dev/null || curl -s http://localhost:3002/ > /dev/null" 0 "critical"

if command -v host &> /dev/null; then
    DOMAIN=$(grep -o "server_name [^;]*;" /etc/nginx/sites-available/whatsapp-proxy 2>/dev/null | awk '{print $2}')
    if [ -n "$DOMAIN" ]; then
        check_item "Domínio resolvendo para este servidor" "host $DOMAIN | grep -q 'has address'" 0 "warning"
        check_item "HTTPS funcionando" "curl -s -k https://$DOMAIN/ping > /dev/null || curl -s -k https://$DOMAIN/ > /dev/null" 0 "warning"
    else
        echo -e "${YELLOW}Não foi possível determinar o domínio configurado no Nginx.${NC}"
    fi
fi

# Resumo
echo -e "\n${BLUE}==============================================${NC}"
echo -e "${BLUE}           RESUMO DA VERIFICAÇÃO             ${NC}"
echo -e "${BLUE}==============================================${NC}"

echo -e "${GREEN}✓ Verificações bem-sucedidas: $PASSED${NC}"
echo -e "${YELLOW}⚠️ Avisos: $WARNINGS${NC}"
echo -e "${RED}✗ Falhas críticas: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "\n${GREEN}Todas as melhorias foram aplicadas com sucesso!${NC}"
    else
        echo -e "\n${YELLOW}A instalação parece estar funcionando, mas com alguns avisos.${NC}"
        echo -e "${YELLOW}Verifique os avisos acima e corrija-os se necessário.${NC}"
    fi
else
    echo -e "\n${RED}A instalação tem falhas críticas que precisam ser corrigidas.${NC}"
    echo -e "${RED}Revise os erros acima e execute os scripts correspondentes novamente.${NC}"
fi

# Limpeza
rm -f /tmp/check_result

echo -e "\n${BLUE}==============================================${NC}" 