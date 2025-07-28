
export interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  tags?: KanbanTag[]; // Make this optional
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isOnline?: boolean;
  funnelStage?: string;
  purchaseValue?: number;
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
}

export interface Deal {
  id: string;
  status: 'won' | 'lost';
  value: number;
  date: string;
  note?: string;
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
}

import { KanbanTag } from "./kanban";
