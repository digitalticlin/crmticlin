
export interface AIAgent {
  id: string;
  name: string;
  type: 'attendance' | 'sales' | 'support' | 'custom';
  status: 'active' | 'inactive';
  funnel_id?: string;
  whatsapp_number_id?: string;
  messages_count: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AIAgentPrompt {
  id: string;
  agent_id: string;
  agent_function: string;
  communication_style: string;
  company_info?: string;
  product_service_info?: string;
  prohibitions?: string;
  objectives: string[];
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAIAgentData {
  name: string;
  type: 'attendance' | 'sales' | 'support' | 'custom';
  funnel_id?: string;
  whatsapp_number_id?: string;
}

export interface CreateAIAgentPromptData {
  agent_id: string;
  agent_function: string;
  communication_style: string;
  company_info?: string;
  product_service_info?: string;
  prohibitions?: string;
  objectives: string[];
}
