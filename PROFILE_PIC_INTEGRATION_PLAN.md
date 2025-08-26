# 📸 Plano de Integração - Fotos de Perfil dos Leads

## 🎯 Modificações necessárias no Frontend

### 1. **Sales Funnel - LeadCardHeader.tsx**
```tsx
// ANTES:
<AvatarImage src={lead.avatar} alt={displayName} />

// DEPOIS:
<AvatarImage src={lead.profile_pic_url || lead.avatar} alt={displayName} />
```

### 2. **WhatsApp Chat - ContactsList.tsx**
```tsx
// ANTES: Avatar hardcoded "T"
<div className="h-12 w-12 rounded-full bg-black flex items-center justify-center ring-2 ring-white/10">
  <span className="text-yellow-400 font-extrabold text-lg">T</span>
</div>

// DEPOIS: Usar Avatar component
<Avatar className="h-12 w-12 ring-2 ring-white/10">
  <AvatarImage src={contact.profile_pic_url} alt={displayName} />
  <AvatarFallback className="bg-black text-yellow-400 font-extrabold text-lg">
    T
  </AvatarFallback>
</Avatar>
```

## 🔧 Backend - Melhorias na Edge Function

### 3. **profile_pic_receiver - Implementar Fila**
- ✅ Atual: Processa instantaneamente
- 🔄 Melhorar: Usar PGMQ para processamento em fila
- 📊 Adicionar: Rate limiting e cache para evitar duplicatas

### 4. **Bulk Update Endpoint - VPS**
```javascript
// Novo endpoint no server.js
POST /bulk-sync-profile-pics
- Processar todos os 5000 leads existentes
- Rate limiting: 100ms entre requests
- Cache: Evitar reprocessamento
- Progress tracking
```

## 📋 Campos da tabela `leads` 

### Campos já existentes:
- ✅ `profile_pic_url` - URL da foto de perfil
- ✅ `phone` - Telefone do lead  
- ✅ `name` - Nome do lead

### Mapeamento necessário:
- **Sales Funnel**: `lead.avatar` → `lead.profile_pic_url`
- **WhatsApp Chat**: `contact.???` → `contact.profile_pic_url`

## 🚀 Ordem de implementação:

1. **Frontend fixes** (rápido)
2. **Test manual sync** (validar)
3. **Queue implementation** (produção)
4. **Bulk sync trigger** (one-time)