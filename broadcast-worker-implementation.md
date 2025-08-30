# 📢 BROADCAST WORKER + EDGE FUNCTION - PLANEJAMENTO COMPLETO

## 🎯 **OBJETIVO:**
Implementar envio em massa (broadcast) pelo CRM com arquitetura FORK + QUEUES conforme @Retornocomando

## 🏗️ **ARQUITETURA BROADCAST:**

```
CRM → Edge Function → VPS (3001) → BROADCAST_QUEUE → Broadcast Worker (3004) → WhatsApp
```

---

## 📋 **COMPONENTES A IMPLEMENTAR:**

### **1. 🔧 Broadcast Worker (Nova Porta 3004):**
```javascript
// src/workers/broadcast-worker.js
const express = require('express');
const app = express();
const PORT = 3004;

// Worker especializado em processamento de broadcasts
// - Rate limiting inteligente (evitar ban WhatsApp)
// - Processamento em lotes
// - Retry automático para falhas
// - Relatórios de entrega em tempo real
```

### **2. 📤 Edge Function (Nova):**
```typescript
// supabase/functions/broadcast_messaging_service/index.ts
// Endpoint: POST /functions/v1/broadcast_messaging_service

{
  "action": "send_broadcast",
  "instanceId": "instancia-id", 
  "campaignId": "campaign-123",
  "contacts": ["5511999999999", "5511888888888"],
  "message": "Mensagem para todos",
  "mediaType": "text",
  "mediaUrl": null,
  "scheduledFor": "2025-08-29T15:00:00Z", // opcional
  "rateLimitMs": 2000 // delay entre envios
}
```

### **3. 📦 Fila Redis Especializada:**
```javascript
// BROADCAST_QUEUE no Redis
// - Prioridades por campanha
// - Rate limiting por instância
// - Tracking de progresso
// - Relatórios de falha/sucesso
```

---

## 🚀 **FLUXO COMPLETO:**

### **📤 ENVIO:**
1. **CRM** → Cria campanha broadcast
2. **Edge Function** → Valida e enfileira em `BROADCAST_QUEUE`
3. **Broadcast Worker** → Processa com rate limiting inteligente
4. **WhatsApp** → Envia mensagens respeitando limites
5. **Webhook Worker** → Recebe confirmações de entrega
6. **CRM** → Atualiza dashboard com progresso

### **📊 MONITORAMENTO:**
- Dashboard tempo real no CRM
- Métricas de entrega/falha
- Rate limiting automático
- Pausa/resume de campanhas

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA:**

### **Ecosystem.config.js (Adicionar):**
```javascript
{
  name: 'broadcast-worker',
  script: 'src/workers/broadcast-worker.js', 
  port: 3004,
  instances: 1,
  max_memory_restart: '512M'
}
```

### **Endpoints VPS (Adicionar):**
```javascript
// server.js
app.post('/queue/add-broadcast', async (req, res) => {
  const { instanceId, campaignId, contacts, message } = req.body;
  
  // Adicionar à BROADCAST_QUEUE
  await broadcastQueue.add('process-campaign', {
    instanceId, campaignId, contacts, message,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, campaignId, queued: contacts.length });
});

app.get('/broadcast-status/:campaignId', (req, res) => {
  // Status da campanha em tempo real
});
```

---

## 📋 **PRÓXIMOS PASSOS:**

1. **Implementar Broadcast Worker** (porta 3004)
2. **Criar Edge Function** broadcast_messaging_service
3. **Adicionar endpoints** `/queue/add-broadcast` no VPS
4. **Integrar dashboard** no CRM para campanhas
5. **Testar rate limiting** e performance

**🎯 RESULTADO:** Sistema de broadcast profissional com filas, rate limiting e monitoramento!