
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
  isFixed?: boolean;
  isHidden?: boolean;
}

export type ColumnType = "new_lead" | "won" | "lost" | "custom";

export const FIXED_COLUMN_IDS = {
  NEW_LEAD: "column-new-lead",
  WON: "column-won",
  LOST: "column-lost"
};
