

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
}

export interface Deal {
  id: string;
  status: 'won' | 'lost';
  value: number;
  date: string;
  note?: string;
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
