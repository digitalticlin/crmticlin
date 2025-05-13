
import { KanbanTag } from "./kanban";

export interface Deal {
  id: string;
  status: "won" | "lost";
  value: number;
  date: string;
  note?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  purchaseValue?: number;
  assignedUser?: string;
  lastMessageTime?: string;
  lastMessage?: string;
  unreadCount?: number;
  avatar?: string;
  company?: string;  // New field for company name
  createdAt?: string; // New field for creation date
  deals?: Deal[]; // New field for deal history
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "contact";
  time: string;
  status?: "sent" | "delivered" | "read";
}

export interface ChatMessage {
  id: string;
  to: string;  // wid@s.whatsapp.net
  from: string;  // bot:xxxxxx@c.us
  ack: number;  // 0: sent, 1: delivered, 2: read
  type: string;  // chat, image, etc
  body: string;
  fromMe: boolean;
  timestamp: number;
  media?: {
    url: string;
    mimetype: string;
  };
}

