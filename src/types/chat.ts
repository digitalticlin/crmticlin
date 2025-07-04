import { KanbanTag } from "./kanban";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  documentId?: string;
  notes?: string;
  tags?: KanbanTag[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  profilePicUrl?: string; // Nova propriedade para foto de perfil do WhatsApp
  isOnline?: boolean;
  createdAt?: string;
  assignedUser?: string;
  purchaseValue?: number;
  deals?: Deal[];
  // Novos campos para melhor integração com leads
  funnelStage?: string;
  priority?: 'low' | 'medium' | 'high';
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
  leadId?: string;
}

export interface Deal {
  id: string;
  status: "won" | "lost";
  value: number;
  date: string;
  note?: string;
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp?: string;
  time?: string;
  status: "sent" | "delivered" | "read";
  mediaType?: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  sender?: "user" | "contact";
  isIncoming?: boolean;
}
