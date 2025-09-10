# 🔧 EDGE FUNCTIONS - AJUSTES PARA ARQUITETURA FORK + QUEUES

## 📤 **1. WHATSAPP_MESSAGING_SERVICE - CORREÇÃO**

**❌ ANTES (linha 440):**
```typescript
const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
```

**✅ AGORA (usar endpoint de fila):**
```typescript
const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/queue/add-message`, {
```

---

## 🤖 **2. AI_MESSAGING_SERVICE - CORREÇÃO**

**❌ ANTES (linha 351):**
```typescript
const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
```

**✅ AGORA (usar endpoint de fila):**
```typescript
const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/queue/add-message`, {
```

---

## 👥 **3. GRUPO_MESSAGING_SERVICE - CORREÇÃO**

**❌ ANTES (linha 117):**
```typescript
const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/send`, {
```

**✅ AGORA (usar endpoint de fila):**
```typescript
const vpsResponse = await fetch(`${VPS_CONFIG.baseUrl}/queue/add-message`, {
```

---

## 📋 **PAYLOAD COMPATIBILIDADE:**

O payload atual das edge functions já está correto para filas:
```typescript
{
  instanceId: "instancia_name", // ✅ correto
  phone: "5511999999999",       // ✅ correto  
  message: "texto da mensagem", // ✅ correto
  mediaType: "text|image|audio",// ✅ correto
  mediaUrl: "url_ou_dataurl"    // ✅ correto
}
```

## 🎯 **BENEFÍCIOS DOS AJUSTES:**

### **⚡ ANTES:**
- Edge function aguardava WhatsApp confirmar entrega
- Timeout de 60 segundos
- Falha se WhatsApp estivesse lento

### **🚀 AGORA:**
- Edge function recebe confirmação imediata de enfileiramento  
- Response em ~200ms
- Message Worker processa em background
- Retry automático se falhar

## 📥 **EDGE FUNCTIONS QUE NÃO PRECISAM AJUSTES:**

- **webhook_whatsapp_web** - VPS continua enviando webhooks normalmente
- **auto_whatsapp_sync** - VPS continua enviando status de conexão
- **webhook_qr_receiver** - VPS continua enviando QR codes
- **whatsapp_instance_manager** - Usa `/instance/create` (não `/send`)  
- **whatsapp_instance_delete** - Usa `/instance/delete` (não `/send`)

## 🔧 **EXECUÇÃO:**
1. Substituir `/send` por `/queue/add-message` nas 3 edge functions
2. Manter payload inalterado
3. Testar response mais rápido
4. Verificar se Message Worker está processando

---

**🎉 RESULTADO:** Edge functions ficam mais rápidas e confiáveis com processamento assíncrono!