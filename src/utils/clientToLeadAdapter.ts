
import { ClientData } from "@/hooks/clients/types";
import { KanbanLead } from "@/types/kanban";

export const clientToLeadAdapter = (client: ClientData): KanbanLead => {
  return {
    id: client.id,
    name: client.name || "Nome não informado",
    phone: client.phone,
    email: client.email,
    company: client.company,
    documentId: client.document_id,
    address: client.address,
    lastMessage: "Contato via sistema",
    lastMessageTime: client.updated_at,
    tags: [], // Tags serão carregadas separadamente se necessário
    notes: client.notes,
    purchaseValue: client.purchase_value,
    assignedUser: undefined, // Pode ser expandido no futuro
    avatar: undefined,
    unreadCount: 0,
    columnId: undefined, // Clientes não têm estágio kanban
  };
};

export const leadToClientAdapter = (lead: KanbanLead): Partial<ClientData> => {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    company: lead.company,
    document_id: lead.documentId,
    address: lead.address,
    notes: lead.notes,
    purchase_value: lead.purchaseValue,
    // Não incluir kanban_stage_id pois clientes não têm essa propriedade
  };
};
