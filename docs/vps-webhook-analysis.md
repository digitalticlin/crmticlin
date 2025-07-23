# 📡 **ANÁLISE DOS WEBHOOKS DA VPS - Estrutura de Dados**

## 🔍 **Informações Enviadas pela VPS quando Recebe uma Mensagem**

### **📋 Estrutura Principal do Payload**

```json
{
  "event": "message_received" | "messages.upsert",
  "instanceId": "string",
  "instanceName": "string", 
  "timestamp": "ISO_STRING",
  "data": {
    "messages": [
      {
        "key": {
          "id": "string",
          "remoteJid": "556299212484@s.whatsapp.net",
          "fromMe": boolean
        },
        "message": {
          // Diferentes tipos de mensagem aqui
        },
        "messageTimestamp": number,
        "pushName": "string"
      }
    ]
  },
  "phone": "556299212484",
  "from": "556299212484@s.whatsapp.net",
  "fromMe": boolean,
  "messageType": "text" | "image" | "video" | "audio" | "document",
  "contactName": "string"
}
```

### **💬 Tipos de Mensagem Detectados**

#### **1. 📝 MENSAGEM DE TEXTO**
```json
{
  "message": {
    "conversation": "Texto da mensagem"
  }
}
```

#### **2. 📝 TEXTO ESTENDIDO**
```json
{
  "message": {
    "extendedTextMessage": {
      "text": "Texto da mensagem",
      "contextInfo": {}
    }
  }
}
```

#### **3. 🖼️ IMAGEM**
```json
{
  "message": {
    "imageMessage": {
      "caption": "Legenda da imagem",
      "url": "https://...",
      "directPath": "/v/...",
      "mediaKey": "base64...",
      "fileLength": number,
      "height": number,
      "width": number,
      "mimetype": "image/jpeg"
    }
  }
}
```

#### **4. 🎥 VÍDEO**
```json
{
  "message": {
    "videoMessage": {
      "caption": "Legenda do vídeo",
      "url": "https://...",
      "directPath": "/v/...",
      "mediaKey": "base64...",
      "fileLength": number,
      "seconds": number,
      "mimetype": "video/mp4"
    }
  }
}
```

#### **5. 🎵 ÁUDIO**
```json
{
  "message": {
    "audioMessage": {
      "url": "https://...",
      "directPath": "/v/...",
      "mediaKey": "base64...",
      "fileLength": number,
      "seconds": number,
      "mimetype": "audio/ogg; codecs=opus"
    }
  }
}
```

#### **6. 📄 DOCUMENTO**
```json
{
  "message": {
    "documentMessage": {
      "caption": "Descrição do documento",
      "fileName": "documento.pdf",
      "url": "https://...",
      "directPath": "/v/...",
      "mediaKey": "base64...",
      "fileLength": number,
      "mimetype": "application/pdf"
    }
  }
}
```

### **🔧 Campos Adicionais Disponíveis**

#### **📞 Informações do Remetente**
- `phone`: Número limpo (556299212484)
- `from`: Número completo com sufixo WhatsApp (@s.whatsapp.net)
- `pushName`: Nome exibido no WhatsApp
- `contactName`: Nome formatado pelo sistema

#### **📱 Informações da Instância**
- `instanceId`: ID único da instância na VPS
- `instanceName`: Nome legível da instância
- `vps_instance_id`: Referência interna da VPS

#### **⏰ Informações Temporais**
- `messageTimestamp`: Timestamp Unix da mensagem
- `timestamp`: ISO string do momento do webhook

#### **🎯 Informações de Estado**
- `fromMe`: Indica se a mensagem foi enviada por nós
- `messageType`: Tipo da mensagem (text, image, video, etc.)
- `event`: Tipo do evento (message_received, messages.upsert)

### **🔗 URLs de Mídia - Estrutura Completa**

A VPS pode fornecer URLs de mídia em vários campos:

```json
{
  // URLs diretas (mais comum)
  "mediaUrl": "https://...",
  "media_url": "https://...",
  
  // URLs aninhadas por tipo
  "image": { "url": "https://..." },
  "video": { "url": "https://..." },
  "audio": { "url": "https://..." },
  "document": { "url": "https://..." },
  
  // URLs na estrutura da mensagem
  "data": {
    "image": { "url": "https://..." },
    "media": { "url": "https://..." },
    "mediaUrl": "https://..."
  },
  
  // URLs na mensagem original
  "message": {
    "imageMessage": { "url": "https://..." },
    "videoMessage": { "url": "https://..." }
  }
}
```

### **🚀 Informações Extras que Poderiam ser Enviadas**

#### **📊 Metadados Avançados**
- `messageQuoted`: Mensagem respondida
- `mentions`: Usuários mencionados
- `location`: Coordenadas GPS (se mensagem de localização)
- `contact`: VCard (se contato compartilhado)

#### **🔐 Informações de Segurança**
- `mediaKey`: Chave de criptografia da mídia
- `fileLength`: Tamanho do arquivo
- `fileSha256`: Hash SHA256 do arquivo

#### **🎭 Informações de Contexto**
- `contextInfo`: Informações de contexto da mensagem
- `forwarded`: Se a mensagem foi encaminhada
- `broadcast`: Se é uma mensagem de broadcast

### **⚡ Otimizações Recomendadas**

#### **1. 🔧 Estrutura Padronizada**
```json
{
  "event": "message_received",
  "instanceId": "string",
  "timestamp": "ISO_STRING",
  "message": {
    "id": "string",
    "from": "556299212484",
    "fromMe": boolean,
    "type": "text|image|video|audio|document",
    "content": {
      "text": "string",
      "caption": "string",
      "mediaUrl": "https://...",
      "fileName": "string",
      "mimeType": "string",
      "fileSize": number
    },
    "contact": {
      "phone": "556299212484",
      "name": "Nome do Contato",
      "pushName": "Nome Push"
    },
    "timestamp": number
  }
}
```

#### **2. 📦 Compressão de Dados**
- Usar campos opcionais para reduzir payload
- Enviar apenas URLs de mídia necessárias
- Comprimir payloads grandes

#### **3. 🔄 Retry Logic**
- Implementar retry automático para webhooks falhados
- Queue de mensagens para casos de instabilidade
- Timeout configurável para requisições

### **🎯 Campos Críticos para o Sistema**

#### **✅ OBRIGATÓRIOS**
- `instanceId`: Identificação da instância
- `from`: Número do remetente
- `content.text`: Texto da mensagem
- `fromMe`: Direção da mensagem
- `timestamp`: Momento da mensagem

#### **⭐ RECOMENDADOS**
- `contact.name`: Nome do contato
- `content.mediaUrl`: URL da mídia
- `content.mimeType`: Tipo do arquivo
- `message.id`: ID único da mensagem

#### **🔧 OPCIONAIS**
- `content.caption`: Legenda de mídia
- `content.fileName`: Nome do arquivo
- `content.fileSize`: Tamanho do arquivo
- `contact.pushName`: Nome push do WhatsApp 