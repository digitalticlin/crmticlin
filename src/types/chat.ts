
export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  phone: string;
  email?: string;
  address?: string;
  tags?: string[];
  notes?: string;
}

export interface Message {
  id: string;
  text: string;
  time: string;
  isIncoming: boolean;
  status?: "sent" | "delivered" | "read";
  media?: {
    type: "image" | "document" | "audio";
    url: string;
    name?: string;
  }[];
}
