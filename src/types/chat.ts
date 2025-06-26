
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  documentId?: string;
  notes?: string;
  tags?: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isOnline?: boolean;
  createdAt?: string;
  assignedUser?: string;
  purchaseValue?: number;
  deals?: Deal[];
  // Novos campos para melhor integração com leads
  funnelStage?: string;
  priority?: 'low' | 'medium' | 'high';
  lastMessageStatus?: 'sent' | 'delivered' | 'read';
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
  timestamp?: string; // Make optional since some messages use 'time' instead
  status: "sent" | "delivered" | "read";
  mediaType?: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  // Additional properties used by components
  sender?: "user" | "contact";
  time?: string;
  isIncoming?: boolean;
}
