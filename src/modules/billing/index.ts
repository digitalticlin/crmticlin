/**
 * Módulo de Billing - Exportações principais
 * Arquivo index para facilitar importações e organizar o módulo
 */

// Hooks principais
export { useBillingData, useBillingPermissions } from './hooks/useBillingData';
export { useMessageUsage } from './hooks/useMessageUsage';
export { useMercadoPagoCheckout } from './hooks/useMercadoPagoCheckout';

// Componentes principais
export { BillingErrorBoundary, withBillingErrorBoundary, useBillingErrorHandler } from './components/BillingErrorBoundary';
export { UsageDisplay } from './components/SafeUsageDisplay';
export { MessagePlanCard } from './components/MessagePlanCard';
export { AlertBanner } from './components/AlertBanner';
export { PlanStatusOverview } from './components/PlanStatusOverview';
export { PlanComparison } from './components/PlanComparison';
export { UpgradeRecommendation } from './components/UpgradeRecommendation';

// Novos componentes UX
export { HeroStatus } from './components/HeroStatus';
export { QuickStatus } from './components/QuickStatus';
export { SimplePlansGrid } from './components/SimplePlansGrid';
export { BillingHistory } from './components/BillingHistory';

// Componentes da nova estrutura
export { PlansActionCards } from './components/PlansActionCards';
export { PlansUpgradeHero } from './components/PlansUpgradeHero';
export { PlansFAQ } from './components/PlansFAQ';

// Serviços
export { MercadoPagoService } from './services/mercadopagoService';

// Tipos e constantes
export type { MessagePlan, PlanSubscription, MessageUsageTracking, UsageLimitCheck } from './types/billing';
export type { BillingData, BillingPermissions } from './hooks/useBillingData';
export type { BillingPermission, BillingQueryKey } from './constants/permissions';

// Query keys e constantes
export {
  BILLING_QUERY_KEYS,
  BILLING_INVALIDATORS,
  BILLING_STALE_TIMES
} from './constants/queryKeys';

export {
  BILLING_PERMISSIONS,
  BILLING_ROLE_PERMISSIONS,
  BILLING_CONTEXTS,
  hasBillingPermission,
  getBillingPermissions,
  canAccessBillingContext,
  hasAllBillingPermissions,
  hasAnyBillingPermission
} from './constants/permissions';

// Dados e configurações
export { messagePlans, getPlanByType, getPlanLimit } from './data/messagePlans';

/**
 * Re-export de utilitários comuns
 */
export const BILLING_MODULE_INFO = {
  name: 'billing',
  version: '1.0.0',
  description: 'Módulo completo de billing com Mercado Pago',
  features: [
    'Gestão de planos e assinaturas',
    'Tracking de uso de mensagens',
    'Integração com Mercado Pago',
    'Sistema de permissões granular',
    'Error boundaries específicos',
    'Query keys isoladas',
    'Defensive coding',
  ],
} as const;