
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  tags: KanbanTag[]; // Mudança: agora usa KanbanTag[] ao invés de string[]
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isOnline?: boolean;
  funnelStage?: string;
  purchaseValue?: number;
  assignedUser?: string;
  profilePicUrl?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  isIncoming?: boolean;
  fromMe?: boolean;
  timestamp?: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

import { KanbanTag } from "./kanban";
