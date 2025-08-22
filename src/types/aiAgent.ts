
export interface AIAgent {
  id: string;
  name: string;
  funnel_id: string;
  whatsapp_number_id: string;
  type: string;
  status: string;
  messages_count: number;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
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
  client_objections: string;
  client_objections_examples: PQExample[];
  business_rules: string;
  business_rules_examples: PQExample[];
  fallback_responses: string;
  conversation_flow: string;
  flow: FlowStepEnhanced[];
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PQExample {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface FlowStepEnhanced {
  id: string;
  step_name: string;
  step_description: string;
  trigger_conditions: string[];
  actions: string[];
  next_steps: string[];
}

export interface FieldWithExamples {
  id: string;
  field_name: string;
  field_value: string;
  examples: PQExample[];
}
