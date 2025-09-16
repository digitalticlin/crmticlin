# PLANO DE IMPLEMENTAÇÃO - SISTEMA UNIFICADO DE MENSAGENS

## 🎯 OBJETIVO
Padronizar o salvamento de TODAS as mensagens com:
- **Texto**: Sempre na coluna `text` (nunca "[Mensagem não suportada]")
- **Mídia**: Emoji descritivo em `text` + URL do Storage em `media_url`
- **Processamento**: Via fila PGMQ para todas as operações

## 📊 PROBLEMAS IDENTIFICADOS
- **2.490** mensagens com "[Mensagem não suportada]"
- **81** vídeos (95%) sem Storage URL
- **215** mídias totais sem Storage
- **2 versões** conflitantes da mesma RPC

## 🏗️ ARQUITETURA PROPOSTA

### 1️⃣ FILA UNIFICADA
```sql
-- Criar fila única para TUDO
pgmq.create('unified_message_queue')

-- Estrutura da mensagem na fila:
{
  "action": "process_message",
  "source": "webhook|app|ai",
  "message_data": {...},
  "media_data": {...},
  "priority": "high|normal|low",
  "retry_count": 0
}
```

### 2️⃣ TRÊS RPCs ISOLADAS

#### A. `save_received_message_webhook`
- Para: webhook_whatsapp_web
- Sempre: from_me = false (ou baseado no payload)
- Processa: Mensagens recebidas da VPS
- Fila: Enfileira mídia para processamento

#### B. `save_sent_message_from_app`
- Para: whatsapp_messaging_service
- Sempre: from_me = true
- Processa: Mensagens enviadas pelo app
- Fila: Enfileira envio + mídia

#### C. `save_sent_message_from_ai`
- Para: ai_messaging_service
- Sempre: from_me = true, ai_flag = true
- Processa: Mensagens do N8N/AI
- Fila: Enfileira envio + mídia

### 3️⃣ PADRÃO DE SALVAMENTO

```typescript
// TODA mídia DEVE seguir este fluxo:
1. Receber mídia (base64, URL, DataURL)
2. Salvar mensagem com text = "🎥 Vídeo" (emoji apropriado)
3. Enfileirar processamento de mídia
4. Worker processa:
   - Upload para Storage
   - Atualiza media_url com URL do Storage
   - Remove base64 do cache
5. Frontend renderiza usando media_url
```

### 4️⃣ MAPEAMENTO DE EMOJIS
```typescript
const MEDIA_EMOJIS = {
  'image': '📷 Imagem',
  'video': '🎥 Vídeo',
  'audio': '🎵 Áudio',
  'document': '📄 Documento',
  'sticker': '😊 Sticker',
  'voice': '🎤 Áudio',
  'ptt': '🎤 Áudio'
}
```

## 📝 PASSO A PASSO DE IMPLEMENTAÇÃO

### FASE 1: Criar Infraestrutura de Filas
1. Criar fila `unified_message_queue`
2. Criar tabela de controle de processamento
3. Criar índices para performance

### FASE 2: Criar RPCs Isoladas
1. Remover versão duplicada (10 params)
2. Criar `save_received_message_webhook`
3. Criar `save_sent_message_from_app`
4. Criar `save_sent_message_from_ai`

### FASE 3: Criar Worker de Processamento
1. Função para processar fila
2. Upload de mídia para Storage
3. Atualização de media_url
4. Retry em caso de falha

### FASE 4-6: Atualizar Edge Functions
1. Cada edge usa sua RPC exclusiva
2. Todas enfileiram mídia
3. Padronizar tratamento de erros

### FASE 7: Testes
1. Texto simples
2. Imagem pequena (<500KB)
3. Vídeo grande (>5MB)
4. Áudio/PTT
5. Documento PDF
6. Sticker

### FASE 8: Migração
1. Identificar mensagens sem Storage
2. Reprocessar mídia antiga
3. Corrigir "[Mensagem não suportada]"

## ✅ CRITÉRIOS DE SUCESSO
- [ ] 100% dos vídeos com Storage URL
- [ ] 0 mensagens "[Mensagem não suportada]"
- [ ] Todas as mídias renderizando no front
- [ ] Sistema de filas funcionando
- [ ] 3 RPCs isoladas sem conflito

## 🚀 PRÓXIMO PASSO
Começar pela FASE 1: Criar a infraestrutura de filas PGMQ