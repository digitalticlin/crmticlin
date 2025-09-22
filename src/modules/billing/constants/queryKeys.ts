/**
 * Query Keys isoladas para o módulo de Billing
 * Seguindo padrão hierarchical para cache invalidation
 */

export const BILLING_QUERY_KEYS = {
  // Root key para todo módulo billing
  all: ['billing'] as const,

  // Planos
  plans: () => [...BILLING_QUERY_KEYS.all, 'plans'] as const,
  plan: (planId: string) => [...BILLING_QUERY_KEYS.plans(), planId] as const,

  // Assinaturas
  subscriptions: () => [...BILLING_QUERY_KEYS.all, 'subscriptions'] as const,
  subscription: (userId: string) => [...BILLING_QUERY_KEYS.subscriptions(), userId] as const,
  userSubscription: (userId: string) => [...BILLING_QUERY_KEYS.subscription(userId), 'current'] as const,

  // Uso de mensagens
  usage: () => [...BILLING_QUERY_KEYS.all, 'usage'] as const,
  userUsage: (userId: string) => [...BILLING_QUERY_KEYS.usage(), userId] as const,
  usageCheck: (userId: string) => [...BILLING_QUERY_KEYS.userUsage(userId), 'check'] as const,
  usageStats: (userId: string) => [...BILLING_QUERY_KEYS.userUsage(userId), 'stats'] as const,

  // Trial gratuito
  trial: () => [...BILLING_QUERY_KEYS.all, 'trial'] as const,
  userTrial: (userId: string) => [...BILLING_QUERY_KEYS.trial(), userId] as const,
  trialEligibility: (userId: string) => [...BILLING_QUERY_KEYS.userTrial(userId), 'eligibility'] as const,

  // Histórico de pagamentos
  payments: () => [...BILLING_QUERY_KEYS.all, 'payments'] as const,
  userPayments: (userId: string) => [...BILLING_QUERY_KEYS.payments(), userId] as const,
  paymentHistory: (userId: string) => [...BILLING_QUERY_KEYS.userPayments(userId), 'history'] as const,

  // Lembretes de cobrança
  reminders: () => [...BILLING_QUERY_KEYS.all, 'reminders'] as const,
  userReminders: (userId: string) => [...BILLING_QUERY_KEYS.reminders(), userId] as const,

  // Status e alertas
  alerts: () => [...BILLING_QUERY_KEYS.all, 'alerts'] as const,
  userAlerts: (userId: string) => [...BILLING_QUERY_KEYS.alerts(), userId] as const,

  // Checkout e sessões
  checkout: () => [...BILLING_QUERY_KEYS.all, 'checkout'] as const,
  checkoutSession: (planId: string) => [...BILLING_QUERY_KEYS.checkout(), planId] as const,
} as const;

/**
 * Invalidators para facilitar cache invalidation
 */
export const BILLING_INVALIDATORS = {
  // Invalidar tudo do billing
  invalidateAll: () => BILLING_QUERY_KEYS.all,

  // Invalidar assinaturas de um usuário
  invalidateUserSubscription: (userId: string) => BILLING_QUERY_KEYS.subscription(userId),

  // Invalidar uso de um usuário
  invalidateUserUsage: (userId: string) => BILLING_QUERY_KEYS.userUsage(userId),

  // Invalidar trial de um usuário
  invalidateUserTrial: (userId: string) => BILLING_QUERY_KEYS.userTrial(userId),

  // Invalidar dados completos do usuário (subscription + usage + trial)
  invalidateUserBilling: (userId: string) => [
    BILLING_QUERY_KEYS.subscription(userId),
    BILLING_QUERY_KEYS.userUsage(userId),
    BILLING_QUERY_KEYS.userTrial(userId),
    BILLING_QUERY_KEYS.userAlerts(userId)
  ],

  // Invalidar apenas alertas e status
  invalidateUserStatus: (userId: string) => [
    BILLING_QUERY_KEYS.userAlerts(userId),
    BILLING_QUERY_KEYS.usageCheck(userId)
  ]
} as const;

/**
 * Stale times para diferentes tipos de dados
 */
export const BILLING_STALE_TIMES = {
  // Dados estáticos (raramente mudam)
  PLANS: 1000 * 60 * 60 * 24, // 24 horas

  // Dados dinâmicos (mudam frequentemente)
  USAGE: 1000 * 60 * 5, // 5 minutos
  ALERTS: 1000 * 60 * 2, // 2 minutos

  // Dados semi-estáticos
  SUBSCRIPTION: 1000 * 60 * 30, // 30 minutos
  TRIAL: 1000 * 60 * 60, // 1 hora
  PAYMENTS: 1000 * 60 * 15, // 15 minutos
} as const;

/**
 * Types para TypeScript
 */
export type BillingQueryKey = ReturnType<typeof BILLING_QUERY_KEYS[keyof typeof BILLING_QUERY_KEYS]>;
export type BillingInvalidator = ReturnType<typeof BILLING_INVALIDATORS[keyof typeof BILLING_INVALIDATORS]>;