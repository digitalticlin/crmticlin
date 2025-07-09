#!/bin/bash

# Script para configurar o firewall UFW
# Protege a porta 3002 e permite apenas as portas necessárias

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Configurando Firewall (UFW) ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Instalar UFW se não estiver instalado"
echo "2. Configurar regras para permitir apenas as portas necessárias"
echo "3. Bloquear acesso direto à porta 3002 exceto localhost"
echo "4. Ativar o firewall"
echo ""

# Verificar se é root
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}Este script deve ser executado como root${NC}" 1>&2
   exit 1
fi

# Verificar se o UFW já está instalado
if ! command -v ufw &> /dev/null; then
    echo -e "${GREEN}Instalando UFW...${NC}"
    apt update
    apt install -y ufw
else
    echo -e "${YELLOW}UFW já está instalado. Prosseguindo com a configuração.${NC}"
fi

# Resetar regras existentes
echo -e "${YELLOW}Resetando regras existentes...${NC}"
ufw --force reset

# Configurar regras padrão
echo -e "${GREEN}Configurando regras padrão...${NC}"
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH (importante para não perder acesso)
echo -e "${GREEN}Permitindo SSH...${NC}"
ufw allow ssh

# Permitir HTTP e HTTPS para Nginx
echo -e "${GREEN}Permitindo HTTP e HTTPS...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp

# Bloquear acesso direto à porta 3002, exceto de localhost
echo -e "${GREEN}Bloqueando acesso direto à porta 3002, exceto de localhost...${NC}"
ufw deny 3002/tcp

# Permitir acesso à porta 3002 apenas de localhost
echo -e "${GREEN}Permitindo acesso à porta 3002 apenas de localhost...${NC}"
ufw allow from 127.0.0.1 to any port 3002

# Verificar se o usuário quer permitir outras portas
read -p "Deseja permitir outras portas? (s/n): " OUTRAS_PORTAS

if [[ "$OUTRAS_PORTAS" =~ ^[Ss]$ ]]; then
    read -p "Digite as portas adicionais separadas por espaço (ex: 8080 8443): " PORTAS_ADICIONAIS
    for porta in $PORTAS_ADICIONAIS; do
        if [[ "$porta" =~ ^[0-9]+$ ]]; then
            echo -e "${GREEN}Permitindo porta $porta...${NC}"
            ufw allow $porta/tcp
        else
            echo -e "${RED}Porta inválida: $porta. Pulando.${NC}"
        fi
    done
fi

# Ativar o firewall
echo -e "${YELLOW}Ativando o firewall...${NC}"
ufw --force enable

# Verificar status
echo -e "${GREEN}Verificando status do firewall...${NC}"
ufw status verbose

echo -e "${GREEN}=== Configuração do Firewall Concluída! ===${NC}"
echo -e "${YELLOW}Importante: O acesso SSH está mantido para evitar perda de acesso.${NC}"
echo -e "${YELLOW}A porta 3002 está bloqueada para acesso externo, mas permitida para localhost.${NC}"
echo -e "${YELLOW}O Nginx deve estar configurado como proxy reverso para a porta 3002.${NC}" 