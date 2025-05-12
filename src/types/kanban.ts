
import { Contact } from "./chat";

export interface KanbanTag {
  id: string;
  name: string;
  color: string;
}

export interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  tags: KanbanTag[];
  notes?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leads: KanbanLead[];
}
