
export interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  address?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  company?: string;
  notes?: string;
  tags?: KanbanTag[]; // Make this optional
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  profile_pic_url?: string;
  isOnline?: boolean;
  funnelStage?: string;
  purchaseValue?: number;
  currentDeal?: CurrentDeal; // ✅ NOVO: Negociação atual
  assignedUser?: string;
  profilePicUrl?: string;
  // Adding missing properties
  documentId?: string;
  leadId?: string;
  createdAt?: string;
  deals?: Deal[];
  stageId?: string; // Added missing stageId property
  ownerId?: string; // ✅ NOVO: Campo para responsável do lead
  // Admin instance info
  instanceInfo?: {
    name: string;
    status: string;
    phone: string;
  };
  // Instância WhatsApp vinculada ao lead (FK para whatsapp_instances.id)
  whatsapp_number_id?: string;
  // ✅ NOVO: Status da conversa para controle de fechamento/arquivamento
  conversation_status?: 'active' | 'closed' | 'archived';
}

export interface Deal {
  id: string;
  status: 'won' | 'lost';
  value: number;
  date: string;
  note?: string;
  stage?: string; // ✅ NOVO: Estágio onde aconteceu
}

// ✅ NOVO: Interface para negociação atual
export interface CurrentDeal {
  id: string;
  value: number;
  status: 'active' | 'pending' | 'negotiating';
  startDate: string;
  currentStage: string;
  notes?: string;
}

// ✅ NOVO: Interface para item do histórico
export interface DealHistoryItem {
  id: string;
  type: 'win' | 'loss';
  value?: number;
  date: string;
  stage: string;
  notes?: string;
}

// ✅ NOVO: Interface para media_cache
export interface MediaCache {
  id: string;
  base64_data?: string | null;
  original_url?: string | null;
  cached_url?: string | null;
  file_size?: number | null;
  media_type?: string | null;
  file_name?: string | null;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  time: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isIncoming?: boolean;
  fromMe?: boolean;
  timestamp?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  // ✅ NOVO: Incluir media_cache
  media_cache?: MediaCache | null;
  // ✅ DEBUGGING: Campos para debugging de mídia
  hasMediaCache?: boolean;
  mediaCacheId?: string;
  // ✅ UI OTIMISTA: Flag para identificar mensagens temporárias
  isOptimistic?: boolean;
  // ✅ FILENAME: Campo para nome do arquivo
  fileName?: string;
  // ✅ SOURCE EDGE: Identifica qual edge function enviou a mensagem
  source_edge?: string;
  // ✅ ENCAMINHAMENTO: Campos para suporte de mensagens encaminhadas
  isForwarded?: boolean;
  forwardedFrom?: string; // Nome do contato original
  originalMessageId?: string; // ID da mensagem original
}

import { KanbanTag } from "./kanban";
