#!/bin/bash

# Script para instalar e configurar Nginx como proxy reverso com SSL
# Para servidor WhatsApp na porta 3002

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando instalação do Nginx como proxy reverso ===${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo "1. Instalar Nginx"
echo "2. Configurar como proxy reverso para a porta 3002"
echo "3. Instalar Certbot e configurar SSL/HTTPS"
echo "4. Configurar regras de segurança básicas"
echo ""

# Verificar se é root
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}Este script deve ser executado como root${NC}" 1>&2
   exit 1
fi

# Obter domínio
read -p "Digite o domínio para configurar o SSL (ex: api.seudominio.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domínio não fornecido. Saindo.${NC}"
    exit 1
fi

# Verificar se o Nginx já está instalado
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx já está instalado. Pulando instalação.${NC}"
else
    echo -e "${GREEN}Instalando Nginx...${NC}"
    apt update
    apt install -y nginx
fi

# Criar configuração do Nginx
echo -e "${GREEN}Configurando Nginx como proxy reverso...${NC}"

# Backup da configuração existente, se houver
if [ -f /etc/nginx/sites-available/default ]; then
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
    echo "Backup da configuração anterior criado em /etc/nginx/sites-available/default.bak"
fi

# Criar configuração do site
cat > /etc/nginx/sites-available/whatsapp-proxy << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/whatsapp-access.log;
    error_log /var/log/nginx/whatsapp-error.log;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Segurança básica
        proxy_read_timeout 90s;
        client_max_body_size 10M;
        
        # Rate limiting - 10 requisições por segundo por IP
        limit_req zone=one burst=10 nodelay;
    }
}
EOF

# Configurar rate limiting no arquivo nginx.conf
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    # Adicionar configuração de rate limiting
    sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;' /etc/nginx/nginx.conf
    echo "Rate limiting configurado"
fi

# Ativar o site
ln -sf /etc/nginx/sites-available/whatsapp-proxy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuração do Nginx
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}Configuração do Nginx inválida. Verifique os erros acima.${NC}"
    exit 1
fi

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}Nginx configurado com sucesso como proxy reverso!${NC}"

# Instalar Certbot e configurar SSL
echo -e "${GREEN}Instalando Certbot e configurando SSL...${NC}"

# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao obter certificado SSL. Verifique se o domínio está apontando para este servidor.${NC}"
    echo -e "${YELLOW}O Nginx continuará funcionando sem SSL.${NC}"
else
    echo -e "${GREEN}Certificado SSL instalado com sucesso!${NC}"
fi

# Configurar renovação automática
echo -e "${GREEN}Configurando renovação automática do certificado...${NC}"
echo "0 3 * * * certbot renew --quiet" | crontab -

echo -e "${GREEN}=== Instalação concluída! ===${NC}"
echo -e "O Nginx está configurado como proxy reverso para o servidor WhatsApp na porta 3002"
echo -e "Acesse seu servidor através de: https://$DOMAIN"
echo -e "${YELLOW}Importante: Certifique-se de que o domínio $DOMAIN está apontando para este servidor${NC}"
echo -e "${YELLOW}e que as portas 80 e 443 estão abertas no firewall.${NC}" 