/**
 * WHATSAPP CHAT - Query Keys - COMPLETAMENTE ISOLADO
 * 
 * Estrutura de isolamento máximo:
 * - Prefixo único: 'chat-'
 * - Separado por módulos/seções do chat
 * - Zero conflito com Sales Funnel e Dashboard
 */

// Módulo: Leads no contexto do Chat
export const chatLeadsQueryKeys = {
  base: ['chat-leads'] as const,
  list: (userId: string) => [
    ...chatLeadsQueryKeys.base,
    'list',
    userId
  ] as const,
  detail: (leadId: string) => [
    ...chatLeadsQueryKeys.base,
    'detail',
    leadId
  ] as const,
} as const;

// Módulo: Estágios no contexto do Chat
export const chatStagesQueryKeys = {
  base: ['chat-stages'] as const,
  byUser: (userId: string) => [
    ...chatStagesQueryKeys.base,
    'by-user',
    userId
  ] as const,
  detail: (stageId: string) => [
    ...chatStagesQueryKeys.base,
    'detail',
    stageId
  ] as const,
} as const;

// Módulo: Contatos WhatsApp
export const chatContactsQueryKeys = {
  base: ['chat-contacts'] as const,
  list: (userId: string) => [
    ...chatContactsQueryKeys.base,
    'list',
    userId
  ] as const,
  search: (userId: string, query: string) => [
    ...chatContactsQueryKeys.base,
    'search',
    userId,
    query
  ] as const,
  detail: (contactId: string) => [
    ...chatContactsQueryKeys.base,
    'detail',
    contactId
  ] as const,
} as const;

// Módulo: Mensagens WhatsApp
export const chatMessagesQueryKeys = {
  base: ['chat-messages'] as const,
  byContact: (contactId: string) => [
    ...chatMessagesQueryKeys.base,
    'by-contact',
    contactId
  ] as const,
  conversation: (conversationId: string) => [
    ...chatMessagesQueryKeys.base,
    'conversation',
    conversationId
  ] as const,
} as const;

// Módulo: Clientes no contexto do Chat
export const chatClientsQueryKeys = {
  base: ['chat-clients'] as const,
  list: (userId: string) => [
    ...chatClientsQueryKeys.base,
    'list',
    userId
  ] as const,
  detail: (clientId: string) => [
    ...chatClientsQueryKeys.base,
    'detail',
    clientId
  ] as const,
} as const;

// Utilitários de Invalidação - ISOLADOS PARA CHAT
export const chatInvalidation = {
  // Invalidar todos os leads do chat
  allChatLeads: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'chat-leads'
  }),
  
  // Invalidar todos os estágios do chat
  allChatStages: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'chat-stages'
  }),
  
  // Invalidar todos os contatos do chat
  allChatContacts: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'chat-contacts'
  }),
  
  // Invalidar todas as mensagens do chat
  allChatMessages: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'chat-messages'
  }),
  
  // Invalidar todos os clientes do chat
  allChatClients: () => ({
    predicate: (query: any) => 
      query.queryKey[0] === 'chat-clients'
  })
} as const;