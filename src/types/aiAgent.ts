
export interface AIAgent {
  id: string;
  name: string;
  type: 'attendance' | 'sales' | 'support' | 'custom';
  status: 'active' | 'inactive';
  funnel_id?: string; // Por enquanto apenas um funil (limitação do banco atual)
  whatsapp_number_id?: string; // Por enquanto apenas uma instância (limitação do banco atual)
  messages_count: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// Estrutura de exemplo Pergunta & Resposta
export interface PQExample {
  id: string;
  question: string;
  answer: string;
}

// Passo do fluxo expandido
export interface FlowStepEnhanced {
  id: string;
  description: string;
  examples: PQExample[];
  order: number;
}

// Campo com exemplos
export interface FieldWithExamples {
  description: string;
  examples: PQExample[];
}

export interface AIAgentPrompt {
  id: string;
  agent_id: string;
  agent_function: string;
  agent_objective: string;
  communication_style: string;
  communication_style_examples: PQExample[];
  company_info: string;
  products_services: string;
  products_services_examples: PQExample[];
  rules_guidelines: string;
  rules_guidelines_examples: PQExample[];
  prohibitions: string;
  prohibitions_examples: PQExample[];
  client_objections: string;
  client_objections_examples: PQExample[];
  phrase_tips: string;
  phrase_tips_examples: PQExample[];
  flow: FlowStepEnhanced[];
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAIAgentData {
  name: string;
  type: 'attendance' | 'sales' | 'support' | 'custom';
  funnel_id?: string | null; // Por enquanto apenas um funil (limitação do banco atual)
  whatsapp_number_id?: string | null; // Por enquanto apenas uma instância (limitação do banco atual)
}

export interface CreateAIAgentPromptData {
  agent_id: string;
  agent_function: string;
  agent_objective: string;
  communication_style: string;
  communication_style_examples: PQExample[];
  company_info: string;
  products_services: string;
  products_services_examples: PQExample[];
  rules_guidelines: string;
  rules_guidelines_examples: PQExample[];
  prohibitions: string;
  prohibitions_examples: PQExample[];
  client_objections: string;
  client_objections_examples: PQExample[];
  phrase_tips: string;
  phrase_tips_examples: PQExample[];
  flow: FlowStepEnhanced[];
}
