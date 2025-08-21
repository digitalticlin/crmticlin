
export * from './aiAgent';
export * from './lead';
export * from './broadcast';

// Common types
export interface Contact {
  id: string;
  phone: string;
  name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  profile_picture?: string;
}

export interface Message {
  id: string;
  phone: string;
  message: string;
  from_me: boolean;
  timestamp: string;
  message_type?: string;
  media_url?: string;
  media_type?: string;
}

export interface LeadData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
