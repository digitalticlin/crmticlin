# 💳 Módulo de Billing

Módulo completo e isolado para gestão de planos, pagamentos e uso de mensagens com integração Mercado Pago.

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/modules/billing/
├── components/          # Componentes UI específicos
│   ├── BillingErrorBoundary.tsx
│   ├── SafeUsageDisplay.tsx
│   ├── MessagePlanCard.tsx
│   └── ...
├── hooks/              # Hooks isolados com defensive coding
│   ├── useBillingData.ts
│   ├── useMessageUsage.ts
│   └── useMercadoPagoCheckout.ts
├── services/           # Serviços de API
│   ├── mercadopagoService.ts
│   └── billingService.ts
├── constants/          # Constantes e configurações
│   ├── queryKeys.ts
│   └── permissions.ts
├── types/             # Tipos TypeScript
│   └── billing.ts
├── data/              # Dados estáticos
│   └── messagePlans.ts
└── index.ts           # Exportações principais
```

## 🔑 Características Principais

### ✅ Defensive Coding
- Fallbacks para todos os dados
- Error boundaries específicos
- Tratamento de estados undefined/null
- Retry automático com limitação

### ✅ Sistema de Permissões
- Roles granulares (operational, manager, admin, super_admin)
- Contextos específicos (plans_page, checkout, admin_panel)
- Verificação de permissões em tempo real

### ✅ Query Keys Isoladas
- Hierarquia clara para cache invalidation
- Stale times otimizados por tipo de dado
- Invalidators específicos

### ✅ Error Handling
- Error boundaries com UI rica
- Fallbacks contextuais
- Logging estruturado
- Retry inteligente

## 🚀 Como Usar

### Hook Principal
```typescript
import { useBillingData, useBillingPermissions } from '@/modules/billing';

function MyComponent() {
  const billing = useBillingData();
  const permissions = useBillingPermissions();

  // Dados sempre seguros com fallbacks
  const { currentUsage, effectiveLimit, billingStatus } = billing;

  // Verificação de permissões
  if (!permissions.canViewPlans) {
    return <NoPermission />;
  }

  return (
    <div>
      <p>Uso: {currentUsage} / {effectiveLimit}</p>
      <p>Status: {billingStatus}</p>
    </div>
  );
}
```

### Componentes com Error Boundary
```typescript
import { BillingErrorBoundary, UsageDisplay } from '@/modules/billing';

function PlansPage() {
  return (
    <BillingErrorBoundary>
      <UsageDisplay />
    </BillingErrorBoundary>
  );
}
```

### Verificação de Permissões
```typescript
import {
  hasBillingPermission,
  BILLING_PERMISSIONS,
  canAccessBillingContext,
  BILLING_CONTEXTS
} from '@/modules/billing';

// Verificar permissão específica
const canActivate = hasBillingPermission(userRole, BILLING_PERMISSIONS.ACTIVATE_TRIAL);

// Verificar acesso a contexto
const canAccessPlans = canAccessBillingContext(userRole, BILLING_CONTEXTS.PLANS_PAGE);
```

## 🔧 Configuração

### 1. Variables de Ambiente (Supabase)
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
FRONTEND_URL=https://seu-dominio.com
AI_AGENT_API_KEY=sua-chave
```

### 2. Migrations
Execute a migration: `20250119_billing_system_mercadopago.sql`

### 3. RPC Functions
As seguintes functions devem estar disponíveis:
- `check_and_increment_ai_usage`
- `can_use_free_trial`
- `process_payment_approved`

## 📊 Dados e Estados

### Estados do Billing
- `inactive` - Sem plano ativo
- `trial` - Trial gratuito ativo
- `active` - Plano pago ativo
- `overdue` - Pagamento em atraso
- `blocked` - Bloqueado por inadimplência

### Planos Disponíveis
- `free_200` - 200 msgs/30 dias (trial)
- `pro_5k` - 5.000 msgs/mês (R$ 399)
- `ultra_15k` - 15.000 msgs/mês (R$ 799)

## 🔒 Permissões

### Roles Disponíveis
- **operational**: Visualizar planos, ativar trial
- **manager**: + Gerenciar assinatura, ver pagamentos
- **admin**: + Gerenciar outros usuários, resetar uso
- **super_admin**: + Configurar sistema

### Contextos
- **plans_page**: Página de planos
- **usage_dashboard**: Dashboard de uso
- **payment_history**: Histórico de pagamentos
- **admin_panel**: Painel administrativo
- **checkout**: Processo de pagamento

## 🚨 Error Handling

### Tipos de Erro
- **Database (406)**: Tabelas não existem ou RLS
- **Data (undefined)**: Propriedades não definidas
- **Network**: Problemas de conexão
- **Unknown**: Outros erros

### Fallbacks
- Dados de uso padrão (200 msgs)
- UI de erro contextual
- Retry automático (limitado)
- Redirecionamento seguro

## 🔄 Cache e Performance

### Stale Times
- **Planos**: 24 horas (dados estáticos)
- **Uso**: 5 minutos (dinâmico)
- **Alertas**: 2 minutos (crítico)
- **Assinatura**: 30 minutos (semi-estático)

### Invalidation
```typescript
import { BILLING_INVALIDATORS } from '@/modules/billing';

// Invalidar dados de um usuário
queryClient.invalidateQueries(
  BILLING_INVALIDATORS.invalidateUserBilling(userId)
);
```

## 🧪 Testing

### Cenários de Teste
1. ✅ Usuário sem plano
2. ✅ Trial ativo
3. ✅ Plano pago ativo
4. ✅ Limite atingido
5. ✅ Pagamento em atraso
6. ✅ Acesso bloqueado
7. ✅ Erros de banco
8. ✅ Dados corrompidos

### Error Boundary Testing
```typescript
// Simular erro para testar error boundary
const ThrowError = () => {
  throw new Error('Test error');
};
```

## 🚀 Deploy

### Checklist
- [ ] Migrations executadas
- [ ] Variables de ambiente configuradas
- [ ] RPC functions deployadas
- [ ] Policies RLS ativas
- [ ] Webhook MP configurado
- [ ] Edge functions publicadas
- [ ] Testes de erro executados

## 🔍 Debugging

### Logs Estruturados
```typescript
console.log('[Billing] Evento:', {
  userId,
  action,
  data,
  timestamp: new Date().toISOString()
});
```

### Query DevTools
Usar React Query DevTools para inspecionar cache:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

## 📈 Monitoring

### Métricas Importantes
- Taxa de erro do error boundary
- Tempo de resposta das queries
- Taxa de retry das queries
- Conversão trial → pago
- Erros de checkout

### Alertas
- Error rate > 5%
- Query failure rate > 10%
- Checkout abandonment > 30%