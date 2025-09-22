/**
 * Sistema de permissões específico para o módulo de Billing
 */

export const BILLING_PERMISSIONS = {
  // Visualização
  VIEW_PLANS: 'billing:view:plans',
  VIEW_USAGE: 'billing:view:usage',
  VIEW_PAYMENTS: 'billing:view:payments',
  VIEW_BILLING_ADMIN: 'billing:view:admin',

  // Ações de usuário
  ACTIVATE_TRIAL: 'billing:action:activate_trial',
  CHANGE_PLAN: 'billing:action:change_plan',
  CANCEL_SUBSCRIPTION: 'billing:action:cancel_subscription',
  VIEW_INVOICES: 'billing:action:view_invoices',

  // Ações administrativas
  MANAGE_USER_PLANS: 'billing:admin:manage_user_plans',
  RESET_USAGE: 'billing:admin:reset_usage',
  APPLY_CUSTOM_LIMITS: 'billing:admin:apply_custom_limits',
  VIEW_ALL_SUBSCRIPTIONS: 'billing:admin:view_all_subscriptions',
  SEND_BILLING_REMINDERS: 'billing:admin:send_reminders',

  // Configurações
  CONFIGURE_PLANS: 'billing:config:plans',
  CONFIGURE_PRICING: 'billing:config:pricing',
  CONFIGURE_PAYMENT_METHODS: 'billing:config:payment_methods',
} as const;

export type BillingPermission = typeof BILLING_PERMISSIONS[keyof typeof BILLING_PERMISSIONS];

/**
 * Mapeamento de roles para permissões de billing
 */
export const BILLING_ROLE_PERMISSIONS = {
  // Usuário básico (trial/operational)
  operational: [
    BILLING_PERMISSIONS.VIEW_PLANS,
    BILLING_PERMISSIONS.VIEW_USAGE,
    BILLING_PERMISSIONS.ACTIVATE_TRIAL,
  ],

  // Usuário gestor (pode gerenciar planos da sua equipe)
  manager: [
    BILLING_PERMISSIONS.VIEW_PLANS,
    BILLING_PERMISSIONS.VIEW_USAGE,
    BILLING_PERMISSIONS.VIEW_PAYMENTS,
    BILLING_PERMISSIONS.ACTIVATE_TRIAL,
    BILLING_PERMISSIONS.CHANGE_PLAN,
    BILLING_PERMISSIONS.CANCEL_SUBSCRIPTION,
    BILLING_PERMISSIONS.VIEW_INVOICES,
  ],

  // Usuário admin (controle total do billing)
  admin: [
    BILLING_PERMISSIONS.VIEW_PLANS,
    BILLING_PERMISSIONS.VIEW_USAGE,
    BILLING_PERMISSIONS.VIEW_PAYMENTS,
    BILLING_PERMISSIONS.VIEW_BILLING_ADMIN,
    BILLING_PERMISSIONS.ACTIVATE_TRIAL,
    BILLING_PERMISSIONS.CHANGE_PLAN,
    BILLING_PERMISSIONS.CANCEL_SUBSCRIPTION,
    BILLING_PERMISSIONS.VIEW_INVOICES,
    BILLING_PERMISSIONS.MANAGE_USER_PLANS,
    BILLING_PERMISSIONS.RESET_USAGE,
    BILLING_PERMISSIONS.APPLY_CUSTOM_LIMITS,
    BILLING_PERMISSIONS.VIEW_ALL_SUBSCRIPTIONS,
    BILLING_PERMISSIONS.SEND_BILLING_REMINDERS,
  ],

  // Super admin (incluindo configurações)
  super_admin: [
    ...Object.values(BILLING_PERMISSIONS),
  ],
} as const;

/**
 * Função para verificar se um role tem uma permissão específica
 */
export const hasBillingPermission = (
  userRole: keyof typeof BILLING_ROLE_PERMISSIONS | string,
  permission: BillingPermission
): boolean => {
  if (!userRole || !(userRole in BILLING_ROLE_PERMISSIONS)) {
    return false;
  }

  const rolePermissions = BILLING_ROLE_PERMISSIONS[userRole as keyof typeof BILLING_ROLE_PERMISSIONS];
  return rolePermissions.includes(permission);
};

/**
 * Função para obter todas as permissões de um role
 */
export const getBillingPermissions = (
  userRole: keyof typeof BILLING_ROLE_PERMISSIONS | string
): BillingPermission[] => {
  if (!userRole || !(userRole in BILLING_ROLE_PERMISSIONS)) {
    return [];
  }

  return BILLING_ROLE_PERMISSIONS[userRole as keyof typeof BILLING_ROLE_PERMISSIONS];
};

/**
 * Contextos específicos para diferentes áreas do billing
 */
export const BILLING_CONTEXTS = {
  PLANS_PAGE: 'plans_page',
  USAGE_DASHBOARD: 'usage_dashboard',
  PAYMENT_HISTORY: 'payment_history',
  ADMIN_PANEL: 'admin_panel',
  CHECKOUT: 'checkout',
} as const;

/**
 * Regras de permissão por contexto
 */
export const CONTEXT_PERMISSIONS = {
  [BILLING_CONTEXTS.PLANS_PAGE]: [
    BILLING_PERMISSIONS.VIEW_PLANS,
    BILLING_PERMISSIONS.ACTIVATE_TRIAL,
    BILLING_PERMISSIONS.CHANGE_PLAN,
  ],

  [BILLING_CONTEXTS.USAGE_DASHBOARD]: [
    BILLING_PERMISSIONS.VIEW_USAGE,
    BILLING_PERMISSIONS.VIEW_PLANS,
  ],

  [BILLING_CONTEXTS.PAYMENT_HISTORY]: [
    BILLING_PERMISSIONS.VIEW_PAYMENTS,
    BILLING_PERMISSIONS.VIEW_INVOICES,
  ],

  [BILLING_CONTEXTS.ADMIN_PANEL]: [
    BILLING_PERMISSIONS.VIEW_BILLING_ADMIN,
    BILLING_PERMISSIONS.MANAGE_USER_PLANS,
    BILLING_PERMISSIONS.VIEW_ALL_SUBSCRIPTIONS,
  ],

  [BILLING_CONTEXTS.CHECKOUT]: [
    BILLING_PERMISSIONS.CHANGE_PLAN,
    BILLING_PERMISSIONS.ACTIVATE_TRIAL,
  ],
} as const;

/**
 * Função para verificar se um usuário pode acessar um contexto específico
 */
export const canAccessBillingContext = (
  userRole: string,
  context: keyof typeof CONTEXT_PERMISSIONS
): boolean => {
  const requiredPermissions = CONTEXT_PERMISSIONS[context];
  const userPermissions = getBillingPermissions(userRole);

  // Usuário precisa ter pelo menos uma das permissões do contexto
  return requiredPermissions.some(permission =>
    userPermissions.includes(permission)
  );
};

/**
 * Função para verificar permissões múltiplas
 */
export const hasAllBillingPermissions = (
  userRole: string,
  permissions: BillingPermission[]
): boolean => {
  return permissions.every(permission =>
    hasBillingPermission(userRole, permission)
  );
};

/**
 * Função para verificar se tem pelo menos uma das permissões
 */
export const hasAnyBillingPermission = (
  userRole: string,
  permissions: BillingPermission[]
): boolean => {
  return permissions.some(permission =>
    hasBillingPermission(userRole, permission)
  );
};