# 🚀 APLICAR CORREÇÕES NA VPS - CONVERSAS BILATERAIS

## 📋 **O que Precisa ser Feito na VPS**

O arquivo `correcao-mensagens-bilaterais.sh` **NÃO PRECISA** ser executado na VPS. Ele é apenas para correção dos arquivos locais.

Na VPS, você precisa **substituir o script principal** pelo script corrigido.

## 🔧 **OPÇÃO 1: Substituir Script Atual (RECOMENDADO)**

### 1. **Fazer Upload do Script Corrigido**
```bash
# No seu servidor/VPS, faça backup do script atual
cp /root/whatsapp-server.js /root/whatsapp-server.js.backup

# Substitua pelo script corrigido (corrigir-webhooks-vps.sh)
# O conteúdo do script dentro do arquivo corrigir-webhooks-vps.sh
```

### 2. **Atualizar o Script Principal**
```bash
# Entre na VPS
ssh root@SEU_IP_VPS

# Pare o serviço atual
pm2 stop whatsapp-server || pkill -f "whatsapp-server"

# Substitua o arquivo pelo script corrigido
nano /root/whatsapp-server.js
# Cole o conteúdo do script corrigido aqui

# Reinicie o serviço
pm2 start /root/whatsapp-server.js --name whatsapp-server
```

## 🔧 **OPÇÃO 2: Deploy Completo (ALTERNATIVA)**

Use a função de deploy automático do CRM:

1. **Acesse Admin → VPS Management**
2. **Clique em "Deploy/Redeploy"** 
3. **Marque "Force Update Scripts"**
4. **Execute o deploy**

## ✅ **SCRIPT CORRIGIDO SUPORTA:**

### 📱 **Tipos de Mídia Completos:**
- ✅ **TEXTO** - Mensagens normais e textos estendidos
- ✅ **IMAGEM** - Fotos com ou sem legenda  
- ✅ **VÍDEO** - Vídeos com ou sem legenda
- ✅ **ÁUDIO** - Mensagens de voz e áudios
- ✅ **DOCUMENTO** - PDFs, DOCs, etc.

### 🔄 **Direções de Mensagem:**
- ✅ **INCOMING** - Mensagens que o lead envia (from_me: false)
- ✅ **OUTGOING** - Mensagens que o usuário envia (from_me: true)

### 📊 **Dados Extraídos:**
```javascript
{
  messageText: "Texto da mensagem ou [Tipo de Mídia]",
  mediaType: "text|image|video|audio|document", 
  mediaUrl: "URL da mídia quando disponível",
  fromMe: true/false,
  direction: "ENVIADA PARA|RECEBIDA DE"
}
```

## 🧪 **COMO TESTAR APÓS APLICAR:**

### 1. **Teste de Texto:**
- Lead envia: "Olá, preciso de ajuda"
- Usuário responde: "Como posso ajudar?"
- ✅ Ambas devem aparecer no chat

### 2. **Teste de Imagem:**  
- Lead envia uma foto
- Usuário envia uma foto
- ✅ Ambas devem aparecer como "[Imagem]" no chat

### 3. **Teste de Áudio:**
- Lead envia áudio
- Usuário envia áudio  
- ✅ Ambos devem aparecer como "[Áudio]" no chat

### 4. **Teste de Vídeo:**
- Lead envia vídeo
- Usuário envia vídeo
- ✅ Ambos devem aparecer como "[Vídeo]" no chat

## 🔍 **VERIFICAR LOGS VPS:**

Após aplicar, os logs devem mostrar:
```bash
[instanceId] 📨 Mensagem RECEBIDA DE (TEXT): 5511999999999 | Olá, preciso de ajuda
[instanceId] 📨 Mensagem ENVIADA PARA (TEXT): 5511999999999 | Como posso ajudar?
[instanceId] 📨 Mensagem RECEBIDA DE (IMAGE): 5511999999999 | [Imagem]
[instanceId] 📨 Mensagem ENVIADA PARA (AUDIO): 5511999999999 | [Áudio]
```

## ⚠️ **IMPORTANTE:**

1. **Backup:** Sempre faça backup antes de substituir scripts
2. **Teste:** Teste em ambiente de desenvolvimento primeiro
3. **Monitoramento:** Monitore logs por algumas horas após a mudança
4. **Rollback:** Tenha plano de rollback caso algo dê errado

## 🚨 **EM CASO DE PROBLEMAS:**

```bash
# Restaurar backup
cp /root/whatsapp-server.js.backup /root/whatsapp-server.js
pm2 restart whatsapp-server

# Verificar logs
pm2 logs whatsapp-server
```

---
**📱 Após aplicar estas correções, o chat WhatsApp terá conversas completamente bilaterais com suporte a todos os tipos de mídia!** 