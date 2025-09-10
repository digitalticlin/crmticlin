# 👁️ READ MESSAGES WORKER - SINCRONIZAÇÃO CRM-WHATSAPP

## 🎯 **OBJETIVO:**
Quando usuário abre conversa no CRM, marcar mensagens como lidas no WhatsApp nativo (mobile/web) para sincronização completa.

## 🔄 **PROBLEMA A RESOLVER:**
```
❌ ANTES:
CRM ← → WhatsApp (não sincronizado)
Usuario lê no CRM → WhatsApp continua mostrando não lida
Usuario lê no WhatsApp → CRM não sabe que foi lida
```

```
✅ DEPOIS:
CRM ↔️ WhatsApp (sincronizado)
Usuario abre conversa no CRM → WhatsApp marca como lida automaticamente
Usuario lê no WhatsApp → CRM recebe webhook de leitura
```

---

## 🏗️ **ARQUITETURA READ MESSAGES:**

```
CRM (abrir conversa) → Edge Function → VPS (3001) → READ_QUEUE → ReadMessages Worker (3005) → Baileys.readMessages() → WhatsApp
```

---

## 📋 **COMPONENTES A IMPLEMENTAR:**

### **1. 🔧 ReadMessages Worker (Nova Porta 3005):**
```javascript
// src/workers/readmessages-worker.js
const express = require('express');
const app = express();
const PORT = 3005;

// Worker especializado em marcar mensagens como lidas
// - Conecta com instâncias WhatsApp via Baileys
// - Executa socket.readMessages([messageIds])
// - Processa em lotes para eficiência
// - Evita spam de read receipts
```

### **2. 📤 Edge Function (Nova):**
```typescript
// supabase/functions/readmessages_service/index.ts
// Endpoint: POST /functions/v1/readmessages_service

{
  "action": "mark_as_read",
  "instanceId": "instancia-id",
  "conversationId": "conversa-123", 
  "messageIds": ["msg1", "msg2", "msg3"], // IDs das mensagens a marcar
  "userId": "user-123" // quem abriu a conversa
}
```

### **3. 📦 Fila Redis Especializada:**
```javascript
// READ_QUEUE no Redis
// - Agrupa mensagens por conversa
// - Evita duplicatas 
// - Rate limiting para não spammar
// - Processa apenas mensagens recebidas (não enviadas)
```

---

## 🚀 **FLUXO COMPLETO:**

### **📖 QUANDO USUÁRIO ABRE CONVERSA NO CRM:**
1. **CRM** → Detecta abertura de conversa
2. **Frontend** → Chama edge function `readmessages_service`
3. **Edge Function** → Valida e enfileira em `READ_QUEUE`
4. **ReadMessages Worker** → Processa fila
5. **Baileys** → Executa `socket.readMessages([messageIds])`
6. **WhatsApp** → Marca mensagens como lidas (✓✓ azul)
7. **Mobile/Web** → Remove sinalizações de não lida

### **📱 RESULTADO:**
- **CRM:** Usuário abre conversa
- **WhatsApp Mobile:** Mensagens ficam ✓✓ azuis automaticamente
- **WhatsApp Web:** Contador de não lidas desaparece

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA:**

### **Ecosystem.config.js (Adicionar):**
```javascript
{
  name: 'readmessages-worker',
  script: 'src/workers/readmessages-worker.js',
  port: 3005, 
  instances: 1,
  max_memory_restart: '256M'
}
```

### **Endpoints VPS (Adicionar):**
```javascript
// server.js
app.post('/queue/mark-as-read', async (req, res) => {
  const { instanceId, messageIds, conversationId } = req.body;
  
  // Filtrar apenas mensagens recebidas (não enviadas)
  const receivedMessages = messageIds.filter(id => 
    !id.startsWith('sent_') // exemplo de filtro
  );
  
  if (receivedMessages.length > 0) {
    await readQueue.add('mark-messages-read', {
      instanceId, 
      messageIds: receivedMessages,
      conversationId,
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({ 
    success: true, 
    markedCount: receivedMessages.length,
    skippedSent: messageIds.length - receivedMessages.length
  });
});
```

### **Worker Implementation:**
```javascript
// src/workers/readmessages-worker.js
const Bull = require('bull');
const readQueue = new Bull('read messages');

readQueue.process('mark-messages-read', async (job) => {
  const { instanceId, messageIds } = job.data;
  
  // Obter socket da instância
  const instance = connectionManager.getInstance(instanceId);
  if (!instance?.socket) {
    throw new Error('Instância não conectada');
  }
  
  // Marcar mensagens como lidas no WhatsApp
  try {
    await instance.socket.readMessages(messageIds);
    console.log(`✓ Marcadas ${messageIds.length} mensagens como lidas`);
    return { success: true, count: messageIds.length };
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    throw error;
  }
});
```

---

## 🎨 **INTEGRAÇÃO COM CRM:**

### **Frontend (quando abrir conversa):**
```javascript
// Quando usuário clica numa conversa
const openConversation = async (conversationId) => {
  // 1. Abrir interface da conversa
  showConversation(conversationId);
  
  // 2. Marcar mensagens como lidas no WhatsApp
  await fetch('/functions/v1/readmessages_service', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      action: 'mark_as_read',
      instanceId: conversation.instanceId,
      conversationId: conversationId,
      messageIds: conversation.unreadMessageIds,
      userId: currentUser.id
    })
  });
  
  // 3. Marcar como lida localmente no CRM
  markLocalAsRead(conversationId);
};
```

---

## 📋 **PRÓXIMOS PASSOS:**

1. **Implementar ReadMessages Worker** (porta 3005)
2. **Criar Edge Function** readmessages_service  
3. **Adicionar endpoint** `/queue/mark-as-read` no VPS
4. **Integrar com CRM** (detectar abertura de conversas)
5. **Testar sincronização** CRM ↔️ WhatsApp
6. **Configurar rate limiting** (evitar spam)

**🎯 RESULTADO:** Sincronização perfeita entre CRM e WhatsApp nativo!

---

## 🔌 **PORTAS NECESSÁRIAS:**

### **📊 RESUMO DE PORTAS APÓS IMPLEMENTAÇÕES:**
- **3001** - Servidor Principal (única externa)
- **3002** - Message Worker (interno) 
- **3003** - Webhook Worker (interno)
- **3004** - Broadcast Worker (interno) - NOVO
- **3005** - ReadMessages Worker (interno) - NOVO

**🔒 IMPORTANTE:** Apenas porta 3001 fica aberta externalmente!