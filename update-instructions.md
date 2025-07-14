# Instruções para Implementar Melhorias no WhatsApp Server

Este documento contém instruções detalhadas para implementar duas melhorias importantes no servidor WhatsApp:

1. **Endpoint Universal para Envio de Mensagens**: Atualizar o endpoint `/send` para suportar todos os tipos de mídia (texto, imagem, vídeo, áudio e documento)
2. **Processamento de Mídia no Webhook**: Garantir que o webhook processe corretamente todos os tipos de mídia recebidos

## Pré-requisitos

- Acesso SSH à VPS
- Permissões de root ou sudo
- Conhecimento básico de comandos Linux

## 1. Conectar-se à VPS

```bash
ssh root@31.97.24.222
```

## 2. Fazer Backup dos Arquivos Originais

```bash
cd /root/whatsapp-server
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)

# Encontrar e fazer backup do arquivo de webhook (se existir)
find . -name "*webhook*.js" -type f -exec cp {} {}.backup-$(date +%Y%m%d-%H%M%S) \;
```

## 3. Implementar o Endpoint Universal para Envio de Mensagens

### 3.1. Criar o Script de Atualização

```bash
nano universal-endpoint-update.js
```

### 3.2. Colar o Conteúdo do Script

Cole o conteúdo do arquivo `universal-endpoint-update.js` que você baixou.

### 3.3. Executar o Script

```bash
node universal-endpoint-update.js
```

## 4. Implementar o Processamento de Mídia no Webhook

### 4.1. Encontrar o Arquivo de Webhook

```bash
find . -name "*webhook*.js" -type f
```

### 4.2. Criar o Script de Atualização

```bash
nano update-webhook-media.js
```

### 4.3. Atualizar o Caminho do Arquivo no Script

Edite a linha que define o `webhookPath` para apontar para o arquivo de webhook correto encontrado no passo 4.1.

```javascript
const webhookPath = '/root/whatsapp-server/NOME_DO_ARQUIVO_ENCONTRADO.js';
```

### 4.4. Colar o Conteúdo do Script

Cole o conteúdo do arquivo `update-webhook-media.js` que você baixou.

### 4.5. Executar o Script

```bash
node update-webhook-media.js
```

## 5. Reiniciar o Servidor

```bash
pm2 restart all
```

## 6. Verificar o Status do Servidor

```bash
pm2 status
curl -s http://localhost:3002/status | jq .
```

## 7. Testar o Envio de Mensagens

### 7.1. Mensagem de Texto

```bash
curl -X POST http://localhost:3002/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -d '{
    "instanceId": "digitalticlin1",
    "phone": "SEU_NUMERO_DE_TELEFONE",
    "message": "Teste de mensagem de texto"
  }'
```

### 7.2. Mensagem com Imagem

```bash
curl -X POST http://localhost:3002/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \
  -d '{
    "instanceId": "digitalticlin1",
    "phone": "SEU_NUMERO_DE_TELEFONE",
    "message": "Teste de mensagem com imagem",
    "mediaType": "image",
    "mediaUrl": "https://picsum.photos/200"
  }'
```

## 8. Verificar os Logs

```bash
pm2 logs
```

## Solução de Problemas

Se encontrar algum erro durante a implementação:

1. Verifique os logs do servidor: `pm2 logs`
2. Restaure o backup se necessário: `cp server.js.backup-TIMESTAMP server.js`
3. Reinicie o servidor: `pm2 restart all`

## Notas Adicionais

- O endpoint `/send` agora suporta os seguintes tipos de mídia: `text`, `image`, `video`, `audio`, `document`
- O webhook agora processa corretamente todos os tipos de mídia recebidos
- As mensagens são enviadas para o webhook original e para o novo webhook do N8N 