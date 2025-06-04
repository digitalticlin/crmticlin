
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
  email?: string;
  company?: string;
  lastMessage: string;
  lastMessageTime: string;
  tags: KanbanTag[];
  notes?: string;
  columnId?: string; // Add columnId to track which column a lead belongs to
  purchaseValue?: number; // Add purchaseValue to track the lead's purchase amount
  assignedUser?: string; // Add assignedUser to track who is responsible for the lead
  kanbanStageId?: string;
  createdAt?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  leads: KanbanLead[];
  isFixed?: boolean;
  isHidden?: boolean;
  color?: string; // Added color property for column customization
}

export type ColumnType = "new_lead" | "won" | "lost" | "custom";

export const FIXED_COLUMN_IDS = {
  NEW_LEAD: "column-new-lead",
  WON: "column-won",
  LOST: "column-lost"
};
