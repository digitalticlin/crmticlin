
import { Contact, Message } from '@/types/chat';

export interface ForwardMessageParams {
  messageId: string;
  contactIds: string[];
  additionalComment?: string;
}

export interface BulkForwardParams {
  message: Message;
  contacts: Contact[];
  additionalComment?: string;
  instanceId: string;
}

export interface ForwardResult {
  success: boolean;
  messageId?: string;
  error?: string;
  contactId: string;
  contactName: string;
}

export interface BulkForwardResult {
  results: ForwardResult[];
  successCount: number;
  failureCount: number;
  totalCount: number;
}

export interface ForwardProgress {
  current: number;
  total: number;
  isCompleted: boolean;
  results: ForwardResult[];
}

export interface ForwardState {
  isModalOpen: boolean;
  selectedMessage: Message | null;
  selectedContacts: Contact[];
  additionalComment: string;
  isForwarding: boolean;
  forwardProgress: ForwardProgress;
}

export interface SelectionState {
  selectedContactIds: Set<string>;
  searchQuery: string;
  filteredContacts: Contact[];
  isAllSelected: boolean;
}
