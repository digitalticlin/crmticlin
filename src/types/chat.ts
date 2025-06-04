
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
  timestamp: string;
  status: "sent" | "delivered" | "read";
  mediaType?: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  // Additional properties used by components
  sender?: "user" | "contact";
  time?: string;
  isIncoming?: boolean;
}
