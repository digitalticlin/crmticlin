
export interface KanbanColumn {
  id: string;
  title: string;
  leads: KanbanLead[];
  color?: string;
  isFixed?: boolean;
  isHidden?: boolean;
  ai_enabled?: boolean; // Nova propriedade para controle de IA
}

export interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  lastMessage: string;
  lastMessageTime: string;
  tags: KanbanTag[];
  notes?: string;
  columnId?: string;
  purchaseValue?: number;
  assignedUser?: string;
  unreadCount: number;
  avatar?: string;
  created_at: string;
  updated_at?: string;
  company_id?: string;
  whatsapp_number_id?: string;
  funnel_id: string;
  kanban_stage_id?: string;
  owner_id?: string;
  // Propriedades do banco que podem ser acessadas via raw data
  last_message?: string;
  purchase_value?: number;
  unread_count?: number;
  documentId?: string;
  address?: string;
  bairro?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}

export interface KanbanTag {
  id: string;
  name: string;
  color: string;
}

// Constantes para IDs de colunas fixas
export const FIXED_COLUMN_IDS = {
  NEW_LEAD: 'new-lead',
  WON: 'won',
  LOST: 'lost'
} as const;
