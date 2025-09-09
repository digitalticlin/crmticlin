# 🔒 SISTEMA DE ISOLAMENTO DE QUERY KEYS

## Problema Resolvido

Quando implementamos DnD no Sales Funnel, criamos query keys centralizadas que conflitaram com outras páginas (Dashboard e WhatsApp Chat), causando:

- ❌ Dashboard KPIs não aparecendo informações
- ❌ WhatsApp Chat sem dados de contatos
- ❌ Invalidação de cache conflituosa entre páginas

## Solução: Isolamento Total por Página

Criamos **query keys completamente isoladas** para cada página, usando prefixos únicos.

---

## 📊 ESTRUTURA DE ISOLAMENTO

### 🎯 **Sales Funnel**
**Localização**: `src/hooks/salesFunnel/queryKeys/index.ts`  
**Prefixo**: `salesfunnel-`

```typescript
// Módulos isolados:
salesFunnelFunnelsQueryKeys.list()    // ➜ ['salesfunnel-funnels', 'list', ...]
salesFunnelStagesQueryKeys.byFunnel() // ➜ ['salesfunnel-stages', 'by-funnel', ...]
salesFunnelLeadsQueryKeys.byFunnel()  // ➜ ['salesfunnel-leads', 'by-funnel', ...]
salesFunnelTagsQueryKeys.byUser()     // ➜ ['salesfunnel-tags', 'by-user', ...]
salesFunnelDealsQueryKeys.byLead()    // ➜ ['salesfunnel-deals', 'by-lead', ...]
salesFunnelAIQueryKeys.stageControl() // ➜ ['salesfunnel-ai', 'stage-control', ...]
```

### 📈 **Dashboard**
**Localização**: `src/hooks/dashboard/queryKeys/index.ts`  
**Prefixo**: `dashboard-`

```typescript
// Módulos isolados:
dashboardKPIsQueryKeys.byPeriod()     // ➜ ['dashboard-kpis', 'by-period', ...]
dashboardChartsQueryKeys.funnelData() // ➜ ['dashboard-charts', 'funnel-data', ...]
dashboardConfigQueryKeys.byUser()     // ➜ ['dashboard-config', 'by-user', ...]
```

### 💬 **WhatsApp Chat**
**Localização**: `src/hooks/chat/queryKeys/index.ts`  
**Prefixo**: `chat-`

```typescript
// Módulos isolados:
chatLeadsQueryKeys.list()          // ➜ ['chat-leads', 'list', ...]
chatStagesQueryKeys.byUser()       // ➜ ['chat-stages', 'by-user', ...]
chatContactsQueryKeys.list()       // ➜ ['chat-contacts', 'list', ...]
chatMessagesQueryKeys.byContact()  // ➜ ['chat-messages', 'by-contact', ...]
chatClientsQueryKeys.list()        // ➜ ['chat-clients', 'list', ...]
```

---

## 🔧 BENEFÍCIOS DA ARQUITETURA

### ✅ **Zero Conflitos**
- Sales Funnel usa `salesfunnel-leads`
- Dashboard usa `dashboard-kpis` 
- Chat usa `chat-leads`
- **Impossível haver colisão**

### ✅ **Invalidação Segura**
```typescript
// Cada página invalida apenas seu próprio cache
queryClient.invalidateQueries({ queryKey: salesFunnelLeadsQueryKeys.base });
queryClient.invalidateQueries({ queryKey: chatLeadsQueryKeys.base });
queryClient.invalidateQueries({ queryKey: dashboardKPIsQueryKeys.base });
```

### ✅ **Manutenibilidade**
- Cada página tem suas próprias query keys
- Mudanças em uma página não afetam outras
- Estrutura modular por seções

### ✅ **Escalabilidade**
- Fácil adicionar novas páginas
- Padrão claro para novos desenvolvedores
- Estrutura preparada para expansão

---

## 🎯 PADRÃO DE NOMENCLATURA

### Estrutura de Query Key:
```typescript
['{página}-{módulo}', '{ação}', ...parâmetros]
```

### Exemplos:
- `['salesfunnel-leads', 'by-funnel', funnelId, userId]`
- `['dashboard-kpis', 'by-period', userId, period]`
- `['chat-contacts', 'list', userId]`

---

## 📁 LOCALIZAÇÃO DOS ARQUIVOS

```
src/hooks/
├── salesFunnel/queryKeys/index.ts  # Sales Funnel (salesfunnel-*)
├── dashboard/queryKeys/index.ts    # Dashboard (dashboard-*)
└── chat/queryKeys/index.ts         # WhatsApp Chat (chat-*)
```

---

## 🔄 HOOKS ATUALIZADOS

### Sales Funnel:
- ✅ `useSalesFunnelDirect.ts`
- ✅ `useLeadsDatabase.ts`
- ✅ `useTagDatabase.ts`
- ✅ `useLeadDeals.ts`

### Chat:
- ✅ `useLeadStageManager.ts`

### Dashboard:
- ✅ Já estava isolado (`dashboard-kpis`)

---

## 🚀 RESULTADO

**Dashboard KPIs**: ✅ Funcionando com dados completos  
**WhatsApp Chat**: ✅ Funcionando com contatos e mensagens  
**Sales Funnel**: ✅ Funcionando com DnD + double-click  

**Zero interferência** entre páginas - cada uma opera de forma completamente independente!