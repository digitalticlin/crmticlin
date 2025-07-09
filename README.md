# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4c4dc1c7-bbf2-4759-9f87-48d9b07a71c7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4c4dc1c7-bbf2-4759-9f87-48d9b07a71c7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4c4dc1c7-bbf2-4759-9f87-48d9b07a71c7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Implementação de QRCodeModal para Conexão WhatsApp

## Problema Resolvido
O problema original era que o QR Code para conectar o WhatsApp não estava sendo exibido automaticamente ao clicar no botão "Conectar WhatsApp". Isso ocorria por dois motivos principais:

1. Erro de extensão de arquivo: o arquivo `useQRCodeModal.ts` estava usando JSX sem ter a extensão `.tsx`
2. Problemas na lógica de exibição do QR Code e tratamento de erros

## Melhorias Implementadas

### 1. Correção de Arquivos
- Renomeado `useQRCodeModal.ts` para `useQRCodeModal.tsx` para permitir o uso de JSX
- Atualizado imports e referências em todos os arquivos relacionados

### 2. Melhorias na Lógica de QR Code
- Implementada validação robusta para QR Codes:
  - Verifica se é uma string data:image válida
  - Confirma se tem tamanho adequado (>500 caracteres)
  - Verifica formato PNG e valida a parte base64
- Melhorados os logs de diagnóstico para acompanhamento do processo
- Adicionada verificação do status de conexão já ativa

### 3. Integração em Tempo Real (Realtime)
- Implementado sistema de Realtime com Supabase para atualizações automáticas de QR Code
- Configuração de canal dedicado para monitorar mudanças na instância
- Tratamento de estados de conexão em tempo real
- Limpeza adequada de inscrições ao fechar modal ou desmontar componente

### 4. Interface de Usuário Aprimorada
- Componente `QRCodeDisplay` para exibir o QR Code com tratamento de erros de carregamento
- Contador de tempo durante o carregamento do QR Code
- Botões para abrir QR Code em nova aba e visualizar detalhes técnicos
- Painel de informações técnicas para diagnóstico
- Botão de atualização manual do QR Code
- Melhor tratamento de erros com mensagens descritivas

### 5. Melhorias no Fluxo de Uso
- Abertura do modal antes de buscar o QR Code para evitar problemas de timing
- Sistema de retry com intervalos curtos (800ms) para melhor responsividade
- Notificações toast para informar o usuário sobre o status
- Tratamento completo de erros nas várias etapas do processo

### 6. Otimizações Técnicas
- Limpeza adequada de timeouts e subscrições para evitar memory leaks
- Verificações de validade antes de processar QR Codes
- Sistema de contexto React para compartilhar o estado do modal em toda a aplicação

## Arquivos Modificados
1. `src/modules/whatsapp/instanceCreation/hooks/useQRCodeModal.tsx`
2. `src/modules/whatsapp/instanceCreation/components/QRCodeModal.tsx`
3. `src/App.tsx` (verificação para garantir que o provider está presente)

## Como Usar
O sistema agora funciona da seguinte forma:

1. Ao clicar em "Conectar WhatsApp", o modal abre automaticamente
2. O sistema busca o QR Code do banco de dados e também se inscreve para atualizações em tempo real
3. O QR Code é validado antes de ser exibido
4. O usuário pode escanear o QR Code ou utilizar os botões de ajuda
5. Informações de diagnóstico estão disponíveis para desenvolvedores

## Considerações Futuras
- Implementar sistema de expiração para QR Codes antigos
- Adicionar animações durante transições de estado
- Melhorar ainda mais o sistema de logs para diagnóstico em produção

# Melhorias para Servidor WhatsApp

Este repositório contém scripts para melhorar a segurança, performance e manutenção do servidor WhatsApp baseado em Baileys.

## 📋 Visão Geral

Os scripts foram desenvolvidos para resolver os seguintes problemas identificados na análise da VPS:

1. **Segurança**: Exposição direta do Node.js, sem HTTPS, sem firewall
2. **Performance**: PM2 em modo fork, alto uso de memória
3. **Monitoramento**: Logs não estruturados, sem rotação
4. **Manutenção**: Sem backup automático, código desorganizado

## 🚀 Scripts Disponíveis

### 1. Segurança

- **install-nginx-proxy.sh**: Instala e configura Nginx como proxy reverso com SSL
- **configure-firewall.sh**: Configura UFW para proteger o servidor
- **setup-env-vars.sh**: Migra credenciais hardcoded para variáveis de ambiente

### 2. Performance

- **configure-pm2-cluster.sh**: Configura PM2 para usar modo cluster

### 3. Monitoramento

- **setup-structured-logging.sh**: Implementa sistema de logs estruturado com Winston

### 4. Manutenção

- **setup-auto-backup.sh**: Configura backup automático diário

### 5. Funcionalidades

- **add-backup-webhook.sh**: Adiciona webhook secundário para backup de mensagens
- **add-group-message-filter.sh**: Implementa filtro para ignorar mensagens de grupos

### 6. Backup e Implantação

- **pre-install-backup.sh**: Cria backup completo antes da instalação
- **deploy-to-vps.sh**: Transfere os scripts para a VPS
- **post-install-check.sh**: Verifica se todas as melhorias foram aplicadas corretamente

### 7. Script Principal

- **install-all-improvements.sh**: Orquestra a instalação de todas as melhorias

## 📦 Pré-requisitos

- Ubuntu/Debian (testado em Ubuntu 20.04)
- Node.js e NPM instalados
- Acesso root
- Servidor WhatsApp baseado em Baileys funcionando

## 🔧 Instalação

### Opção 1: Instalação Completa

Execute o script principal para instalar todas as melhorias:

```bash
chmod +x install-all-improvements.sh
sudo ./install-all-improvements.sh
```

### Opção 2: Instalação Individual

Você pode executar os scripts individualmente na seguinte ordem recomendada:

```bash
# 0. Fazer backup do sistema antes de qualquer modificação
chmod +x pre-install-backup.sh
sudo ./pre-install-backup.sh

# 1. Migrar credenciais para variáveis de ambiente
chmod +x setup-env-vars.sh
sudo ./setup-env-vars.sh

# 2. Instalar Nginx como proxy reverso
chmod +x install-nginx-proxy.sh
sudo ./install-nginx-proxy.sh

# 3. Configurar firewall
chmod +x configure-firewall.sh
sudo ./configure-firewall.sh

# 4. Implementar sistema de logs estruturado
chmod +x setup-structured-logging.sh
sudo ./setup-structured-logging.sh

# 5. Configurar PM2 em modo cluster
chmod +x configure-pm2-cluster.sh
sudo ./configure-pm2-cluster.sh

# 6. Configurar backup automático
chmod +x setup-auto-backup.sh
sudo ./setup-auto-backup.sh

# 7. Adicionar webhook de backup para mensagens
chmod +x add-backup-webhook.sh
sudo ./add-backup-webhook.sh

# 8. Implementar filtro para mensagens de grupos
chmod +x add-group-message-filter.sh
sudo ./add-group-message-filter.sh

# 9. Verificar se todas as melhorias foram aplicadas corretamente
chmod +x post-install-check.sh
sudo ./post-install-check.sh
```

## 🔍 Verificação

Após a instalação, verifique se tudo está funcionando corretamente:

1. **Nginx**: `systemctl status nginx`
2. **Firewall**: `ufw status`
3. **PM2**: `pm2 status`
4. **Logs**: `tail -f /root/whatsapp-servver/logs/whatsapp-*.log`
5. **Backup**: `ls -la /root/whatsapp-servver/backups/`

## ⚠️ Importante

- **Faça backup** do sistema antes de executar os scripts
- Os scripts assumem que o servidor WhatsApp está em `/root/whatsapp-servver`
- Se o caminho for diferente, você será solicitado a fornecer o caminho correto
- Certifique-se de que o domínio apontado para o servidor está correto antes de configurar o SSL

## 🔄 Restauração

Em caso de problemas, você pode restaurar o sistema usando o script de restauração:

```bash
cd /root/whatsapp-servver
./restore.sh
```

## 📝 Logs

Os logs serão salvos em:

```
/root/whatsapp-servver/logs/
```

Tipos de logs disponíveis:
- `whatsapp-YYYY-MM-DD.log`: Logs gerais
- `error-YYYY-MM-DD.log`: Logs de erro
- `exceptions-YYYY-MM-DD.log`: Exceções não tratadas
- `rejections-YYYY-MM-DD.log`: Promessas rejeitadas não tratadas

## 🔒 Segurança

Após a instalação:
- O servidor Node.js não estará mais exposto diretamente na internet
- Todo o tráfego será criptografado com SSL
- Apenas as portas necessárias estarão abertas (80, 443, SSH)
- As credenciais estarão em variáveis de ambiente, não no código

## 📈 Performance

- O PM2 será configurado em modo cluster para aproveitar múltiplos cores
- A configuração de memória será otimizada
- O sistema de logs será mais eficiente

## 📚 Manutenção

- Backups automáticos diários
- Rotação de logs
- Monitoramento de erros

## 🛠️ Solução de Problemas

### Nginx não inicia

```bash
systemctl status nginx
# Verifique os logs
cat /var/log/nginx/error.log
```

### PM2 não inicia em modo cluster

```bash
cd /root/whatsapp-servver
pm2 logs
# Voltar para modo fork se necessário
pm2 stop all && pm2 delete all && pm2 start serverjs-atual
```

### Problemas com SSL

```bash
certbot certificates
# Renovar certificado manualmente
certbot renew --dry-run
```

### Firewall bloqueando acesso

```bash
# Desativar temporariamente
ufw disable
# Reativar após resolver o problema
ufw enable
```
