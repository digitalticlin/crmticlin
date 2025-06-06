
import { Contact } from "./chat";

export interface KanbanTag {
  id: string;
  name: string;
  color: string;
}

export interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  documentId?: string;
  document_type?: 'cpf' | 'cnpj';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  lastMessage: string;
  last_message?: string;
  lastMessageTime: string;
  last_message_time?: string;
  tags: KanbanTag[];
  notes?: string;
  columnId?: string;
  purchaseValue?: number;
  purchase_value?: number;
  assignedUser?: string;
  avatar?: string;
  unreadCount?: number;
  unread_count?: number;
  
  // Sistema e relacionamentos
  created_at?: string;
  updated_at?: string;
  company_id?: string;
  whatsapp_number_id?: string;
  funnel_id?: string;
  kanban_stage_id?: string;
  owner_id?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leads: KanbanLead[];
  isFixed?: boolean;
  isHidden?: boolean;
  color?: string;
}

export type ColumnType = "new_lead" | "won" | "lost" | "custom";

export const FIXED_COLUMN_IDS = {
  NEW_LEAD: "column-new-lead",
  WON: "column-won",
  LOST: "column-lost"
};
