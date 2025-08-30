
import { KanbanLead } from "@/types/kanban";

/**
 * Transform raw database leads to KanbanLead format
 */
export const transformDatabaseLeadToKanban = (lead: any): KanbanLead => {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || undefined,
    company: lead.company || undefined,
    lastMessage: lead.last_message || "Sem mensagens",
    lastMessageTime: lead.last_message_time ? new Date(lead.last_message_time).toISOString() : new Date().toISOString(),
    tags: [],
    notes: lead.notes || undefined,
    columnId: lead.kanban_stage_id || undefined,
    purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
    assignedUser: lead.owner?.full_name || lead.owner_id || undefined,
    unreadCount: lead.unread_count || 0,
    avatar: undefined,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    company_id: undefined,
    whatsapp_number_id: lead.whatsapp_number_id || undefined,
    funnel_id: lead.funnel_id,
    kanban_stage_id: lead.kanban_stage_id || undefined,
    owner_id: lead.owner_id || undefined,
    // Propriedades do banco para compatibilidade
    last_message: lead.last_message,
    purchase_value: lead.purchase_value,
    unread_count: lead.unread_count,
    documentId: lead.document_id || undefined,
    address: lead.address || undefined,
    bairro: lead.bairro || undefined,
    city: lead.cidade || undefined,
    state: lead.estado || undefined,
    country: lead.pais || undefined,
    zip_code: lead.cep || undefined
  };
};

/**
 * Create tag and other utility operations placeholders
 */
export const createTagWrapper = (name: string, color: string) => {
  console.log('[leadTransformers] 🏷️ Criando tag:', name, color);
  // Por agora apenas log - pode implementar depois
};

export const moveLeadToStageWrapper = (lead: any, columnId: string) => {
  console.log('[leadTransformers] 🔄 Movendo lead:', lead.name, 'para', columnId);
  // Por agora apenas log - pode implementar depois
};
