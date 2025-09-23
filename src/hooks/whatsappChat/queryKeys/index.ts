/**
 * WHATSAPP CHAT - Query Keys - COMPLETAMENTE ISOLADO
 *
 * Estrutura de isolamento máximo:
 * - Prefixo único: 'whatsappchat-'
 * - Separado por módulos/seções
 * - Zero conflito com outras páginas
 */

// Módulo: Contatos
export const whatsappChatContactsQueryKeys = {
  base: ['whatsappchat-contacts'] as const,
  list: (instanceId: string, userId: string) => [
    ...whatsappChatContactsQueryKeys.base,
    'list',
    instanceId,
    userId
  ] as const,
  search: (instanceId: string, userId: string, query: string, filterType: string) => [
    ...whatsappChatContactsQueryKeys.base,
    'search',
    instanceId,
    userId,
    query,
    filterType
  ] as const,
  infinite: (instanceId: string, userId: string, filters?: Record<string, any>) => [
    ...whatsappChatContactsQueryKeys.base,
    'infinite',
    instanceId,
    userId,
    filters || {}
  ] as const,
  detail: (contactId: string) => [
    ...whatsappChatContactsQueryKeys.base,
    'detail',
    contactId
  ] as const,
} as const;

// Módulo: Mensagens
export const whatsappChatMessagesQueryKeys = {
  base: ['whatsappchat-messages'] as const,
  byContact: (contactId: string, instanceId: string, userId: string) => [
    ...whatsappChatMessagesQueryKeys.base,
    'by-contact',
    contactId,
    instanceId,
    userId
  ] as const,
  infinite: (contactId: string, instanceId: string, userId: string) => [
    ...whatsappChatMessagesQueryKeys.base,
    'infinite',
    contactId,
    instanceId,
    userId
  ] as const,
  unread: (contactId: string) => [
    ...whatsappChatMessagesQueryKeys.base,
    'unread',
    contactId
  ] as const,
} as const;

// Módulo: Instâncias
export const whatsappChatInstancesQueryKeys = {
  base: ['whatsappchat-instances'] as const,
  list: (userId: string, companyId: string) => [
    ...whatsappChatInstancesQueryKeys.base,
    'list',
    userId,
    companyId
  ] as const,
  active: (userId: string, companyId: string) => [
    ...whatsappChatInstancesQueryKeys.base,
    'active',
    userId,
    companyId
  ] as const,
  health: (instanceId: string) => [
    ...whatsappChatInstancesQueryKeys.base,
    'health',
    instanceId
  ] as const,
} as const;

// Módulo: Filtros
export const whatsappChatFiltersQueryKeys = {
  base: ['whatsappchat-filters'] as const,
  tags: (userId: string) => [
    ...whatsappChatFiltersQueryKeys.base,
    'tags',
    userId
  ] as const,
  funnels: (userId: string) => [
    ...whatsappChatFiltersQueryKeys.base,
    'funnels',
    userId
  ] as const,
} as const;

// Utilitários de Invalidação - ISOLADOS
export const whatsappChatInvalidation = {
  allContacts: (instanceId: string, userId: string) => ({
    predicate: (query: any) =>
      query.queryKey[0] === 'whatsappchat-contacts' &&
      query.queryKey[2] === instanceId &&
      query.queryKey[3] === userId
  }),

  allMessages: (contactId: string, instanceId: string) => ({
    predicate: (query: any) =>
      query.queryKey[0] === 'whatsappchat-messages' &&
      query.queryKey[2] === contactId &&
      query.queryKey[3] === instanceId
  }),

  allInstances: (userId: string, companyId: string) => ({
    predicate: (query: any) =>
      query.queryKey[0] === 'whatsappchat-instances' &&
      query.queryKey[2] === userId &&
      query.queryKey[3] === companyId
  }),
} as const;