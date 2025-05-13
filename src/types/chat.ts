
export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  address?: string; // Add address property
  purchaseValue?: number;
  assignedUser?: string;
}

export interface Message {
  id: string;
  text: string;
  time: string;
  isIncoming: boolean;
  status?: "sent" | "delivered" | "read";
  media?: {
    type: "image" | "video" | "audio" | "file";
    url: string;
    name?: string;
    size?: number;
  };
}

export type MessageStatus = "sent" | "delivered" | "read";
