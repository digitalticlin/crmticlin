# 🏗️ ARQUITETURA 100% ISOLADA - SISTEMA OPERACIONAL

## 📋 PRINCÍPIOS DE ISOLAMENTO TOTAL

### 🎯 **ZERO DEPENDÊNCIAS COMPARTILHADAS**
- ❌ Não usar hooks existentes
- ❌ Não modificar componentes admin
- ❌ Não compartilhar lógica de estado
- ✅ Criar ecosystem operacional independente

---

## 📁 **ESTRUTURA COMPLETAMENTE ISOLADA**

```
src/
├── operational/                           # 🆕 MÓDULO ISOLADO
│   │
│   ├── app/                              # 🆕 App operacional independente
│   │   ├── OperationalApp.tsx            # App root operacional
│   │   ├── OperationalRouter.tsx         # Router isolado
│   │   └── OperationalLayout.tsx         # Layout específico
│   │
│   ├── pages/                            # 🆕 Páginas 100% isoladas
│   │   ├── OperationalDashboard.tsx
│   │   ├── OperationalSalesFunnel.tsx
│   │   ├── OperationalClients.tsx
│   │   ├── OperationalWhatsAppChat.tsx
│   │   └── index.ts
│   │
│   ├── components/                       # 🆕 Componentes exclusivos
│   │   ├── dashboard/
│   │   │   ├── OpDashboardHeader.tsx
│   │   │   ├── OpKPIGrid.tsx
│   │   │   ├── OpChartsSection.tsx
│   │   │   ├── OpPeriodFilter.tsx
│   │   │   └── index.ts
│   │   ├── sales/
│   │   │   ├── OpSalesFunnel.tsx
│   │   │   ├── OpKanbanBoard.tsx
│   │   │   ├── OpLeadCard.tsx
│   │   │   └── index.ts
│   │   ├── chat/
│   │   │   ├── OpChatList.tsx
│   │   │   ├── OpMessageThread.tsx
│   │   │   └── index.ts
│   │   ├── clients/
│   │   │   ├── OpClientsList.tsx
│   │   │   ├── OpClientCard.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── OpSidebar.tsx
│   │   │   ├── OpHeader.tsx
│   │   │   ├── OpNavigation.tsx
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── OpRoleGuard.tsx           # Guard operacional isolado
│   │   │   ├── OpProtectedRoute.tsx      # Proteção isolada
│   │   │   └── index.ts
│   │   └── ui/                           # 🔄 UI components reutilizados
│   │       └── index.ts                  # Re-exports dos UI base
│   │
│   ├── hooks/                            # 🆕 Hooks 100% isolados
│   │   ├── core/
│   │   │   ├── useOpAuth.ts              # Auth operacional isolado
│   │   │   ├── useOpRole.ts              # Role operacional isolado
│   │   │   ├── useOpPermissions.ts       # Permissions operacional isolado
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── useOpDashboardData.ts
│   │   │   ├── useOpKPIs.ts
│   │   │   ├── useOpCharts.ts
│   │   │   └── index.ts
│   │   ├── sales/
│   │   │   ├── useOpLeads.ts
│   │   │   ├── useOpFunnels.ts
│   │   │   ├── useOpKanban.ts
│   │   │   └── index.ts
│   │   ├── chat/
│   │   │   ├── useOpWhatsAppMessages.ts
│   │   │   ├── useOpChatList.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── contexts/                         # 🆕 Contexts isolados
│   │   ├── OpAuthContext.tsx
│   │   ├── OpDataContext.tsx
│   │   ├── OpFilterContext.tsx
│   │   └── index.ts
│   │
│   ├── services/                         # 🆕 Services isolados
│   │   ├── opSupabaseService.ts          # Service layer isolado
│   │   ├── opDataFilters.ts              # Filtros automáticos
│   │   └── index.ts
│   │
│   ├── types/                            # 🆕 Types específicos
│   │   ├── operational.ts
│   │   ├── opDashboard.ts
│   │   ├── opSales.ts
│   │   └── index.ts
│   │
│   ├── utils/                            # 🆕 Utils isolados
│   │   ├── opDataTransform.ts
│   │   ├── opFilters.ts
│   │   ├── opValidation.ts
│   │   └── index.ts
│   │
│   └── index.ts                          # Entry point do módulo
│
├── admin/                                # 🆕 MÓDULO ADMIN (migração futura)
│   └── [estrutura similar isolada]
│
└── shared/                               # 🔄 APENAS UI e utils base
    ├── ui/                               # Components UI reutilizáveis
    │   ├── Button.tsx
    │   ├── Modal.tsx
    │   ├── Input.tsx
    │   └── index.ts
    ├── utils/
    │   ├── dateUtils.ts
    │   ├── formatters.ts
    │   └── index.ts
    └── types/
        ├── common.ts
        └── index.ts
```

---

## 🔧 **IMPLEMENTAÇÃO DO ISOLAMENTO**

### **1. Entry Point Condicional**
```typescript
// src/App.tsx (MODIFICAÇÃO MÍNIMA)
import { useUserRole } from './hooks/useUserRole'; // Apenas para detecção
import AdminApp from './admin/AdminApp';
import OperationalApp from './operational/OperationalApp';

function App() {
  const { role, loading } = useUserRole();
  
  if (loading) return <LoadingScreen />;
  
  // 🎯 SWITCH TOTAL ENTRE APPS
  return role === 'admin' ? <AdminApp /> : <OperationalApp />;
}
```

### **2. App Operacional Isolado**
```typescript
// src/operational/app/OperationalApp.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { OpAuthProvider } from '../contexts/OpAuthContext';
import { OpDataProvider } from '../contexts/OpDataContext';
import OperationalRouter from './OperationalRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 🔧 Configurações específicas operacional
      staleTime: 5 * 60 * 1000, // 5min cache
      retry: 1, // Menos retries
    }
  }
});

export default function OperationalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OpAuthProvider>
          <OpDataProvider>
            <OperationalRouter />
          </OpDataProvider>
        </OpAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### **3. Service Layer com Filtros Automáticos**
```typescript
// src/operational/services/opSupabaseService.ts
import { supabase } from '@/integrations/supabase/client';

class OperationalSupabaseService {
  private userId: string | null = null;
  
  constructor() {
    this.initUserId();
  }
  
  private async initUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }
  
  // 🔧 MÉTODO BASE: Sempre filtra por owner_id
  private getBaseQuery(table: string) {
    if (!this.userId) throw new Error('User not authenticated');
    
    return supabase
      .from(table)
      .select('*')
      .eq('owner_id', this.userId); // 🔒 FILTRO AUTOMÁTICO
  }
  
  // 🎯 MÉTODOS ESPECÍFICOS
  async getLeads() {
    return this.getBaseQuery('leads');
  }
  
  async getFunnels() {
    return this.getBaseQuery('funnels')
      .or(`created_by_user_id.eq.${this.userId},team_members.cs.{"${this.userId}"}`);
  }
  
  async getMessages() {
    return supabase
      .from('messages')
      .select(`
        *,
        lead:leads!inner(*)
      `)
      .eq('leads.owner_id', this.userId); // 🔒 JOIN com filtro
  }
}

export const opSupabaseService = new OperationalSupabaseService();
```

### **4. Hooks com Filtros Automáticos**
```typescript
// src/operational/hooks/dashboard/useOpKPIs.ts
import { useQuery } from '@tanstack/react-query';
import { opSupabaseService } from '../../services/opSupabaseService';

export const useOpKPIs = () => {
  return useQuery({
    queryKey: ['op-kpis'], // 🏷️ Namespace isolado
    queryFn: async () => {
      const [leads, messages] = await Promise.all([
        opSupabaseService.getLeads(),
        opSupabaseService.getMessages()
      ]);
      
      // 🔧 Cálculos específicos operacional
      return {
        totalLeads: leads.data?.length || 0,
        totalMessages: messages.data?.length || 0,
        conversionRate: calculateOpConversionRate(leads.data),
        responseTime: calculateOpResponseTime(messages.data)
      };
    }
  });
};
```

---

## 🛡️ **PROTEÇÕES DE ISOLAMENTO**

### **1. Namespace de QueryKeys**
```typescript
// Operational: ['op-leads'], ['op-dashboard'], ['op-kpis']
// Admin: ['admin-leads'], ['admin-dashboard'], ['admin-kpis']
// ✅ Zero conflito entre caches
```

### **2. Context Isolado**
```typescript
// src/operational/contexts/OpDataContext.tsx
const OpDataContext = createContext({
  userId: null,
  filters: { owner_id: null },
  // 🔧 Estado específico operacional
});
```

### **3. Router Isolado**
```typescript
// src/operational/app/OperationalRouter.tsx
const OperationalRouter = () => (
  <Routes>
    {/* 🎯 Apenas rotas operacionais */}
    <Route path="/" element={<OpDashboard />} />
    <Route path="/sales" element={<OpSales />} />
    {/* ❌ Sem rota /settings (bloqueada) */}
  </Routes>
);
```

---

## 📈 **VANTAGENS DO ISOLAMENTO TOTAL**

### **✅ Para Desenvolvimento**
1. **Zero Impacto Admin**: Modificações operacionais não afetam admin
2. **Desenvolvimento Paralelo**: Teams podem trabalhar independentemente  
3. **Testing Isolado**: Testes unitários sem interferência
4. **Bundle Splitting**: Carrega apenas código necessário

### **✅ Para Manutenção**
1. **Debugging Simples**: Erros isolados por módulo
2. **Refactoring Seguro**: Mudanças não propagam
3. **Performance Otimizada**: Queries e cache específicos
4. **Escalabilidade**: Adicionar novos níveis sem refactoring

### **✅ Para Segurança**
1. **Isolamento de Dados**: Impossível vazamento entre níveis
2. **Permissions Granulares**: Controle total por contexto
3. **Auditoria Separada**: Logs isolados por tipo de usuário

---

## 🚀 **MIGRAÇÃO GRADUAL (OPCIONAL)**

```
FASE 1: Implementar Operational (isolado)
├── Manter admin atual funcionando
├── Criar módulo operational completo
└── Switch condicional no App.tsx

FASE 2: Migrar Admin (futuro)
├── Mover código admin para módulo admin/
├── Isolar hooks e components admin
└── Garantir zero breaking changes

FASE 3: Otimização
├── Bundle splitting por módulo
├── Lazy loading por role
└── Performance tuning específico
```

---

## ✅ **RESUMO EXECUTIVO**

**🎯 ISOLAMENTO**: 100% garantido
- Operational não usa NENHUM hook/component admin
- Admin não é afetado por mudanças operacionais
- Services e contexts completamente separados

**🛠️ FLEXIBILIDADE**: Total
- Modificar dashboard operacional → Zero impacto admin
- Adicionar funcionalidades operacionais → Zero risco
- Refactoring operacional → Admin intocado

**🚀 PERFORMANCE**: Otimizada  
- Queries específicas por contexto
- Cache isolado por namespace
- Bundle splitting automático

**📊 RESULTADO**: Sistema operacional implementável sem QUALQUER risco ao sistema admin atual.