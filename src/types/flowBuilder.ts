// ===== TIPOS BASE =====
export type StepAction =
  // Especial
  | "initial_presentation"   // 👋 Apresentação Inicial (Bloco Especial)
  // Comunicação
  | "ask_question"           // 💬 Fazer Pergunta
  | "request_document"       // 📄 Solicitar Documento
  | "send_message"           // 📤 Enviar Mensagem
  | "provide_instructions"   // 🎓 Ensinar/Orientar
  // Lógica
  | "validate_document"      // 🔍 Validar Documento
  | "branch_decision"        // 🔀 Decisão
  | "check_if_done"          // 🔍 Verificar Se Já Fez
  | "retry_with_variation"   // 🔁 Repetir com Variação
  // CRM
  | "update_lead_data"       // 📝 Atualizar Dados do Lead
  | "move_lead_in_funnel"    // 🎯 Mover Lead no Funil
  // Controle
  | "wait_for_action"        // ⏳ Aguardar Ação
  | "transfer_to_human"      // 📞 Encaminhar para Humano
  | "end_conversation";      // ✅ Finalizar Conversa

export type DecisionType =
  | "if_user_says"      // SE o cliente responder
  | "if_receives_file"  // SE receber arquivo
  | "if_no_response"    // SE não responder nada
  | "always"            // Sempre ir para
  | "fallback";         // Fallback após tentativas

export type OperatorType =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "not_empty";

// ===== VALIDAÇÃO =====
export interface ValidationCheck {
  field: string;
  operator: OperatorType;
  value?: any;
  description: string;
}

export interface PreValidation {
  checks: ValidationCheck[];
  skipTo?: string;
  required?: "all" | "any";
}

// ===== MENSAGEM =====
export interface MessageText {
  type: "text";
  content: string;
  variables?: string[];
  delay?: number;
}

export interface MessageConditional {
  type: "conditional_response";
  conditions: {
    if: string;
    response: string;
  }[];
}

export type Message = MessageText | MessageConditional;

// ===== DECISÃO (Conexão entre nós) =====
export interface Decision {
  id: string;
  type: DecisionType;
  condition: string;           // Texto simples: "tenho o extrato", "não tenho"
  targetStepId: string;        // ID do próximo passo
  priority?: number;           // Ordem de avaliação
  action?: string;             // Ex: "STORE:nome_cliente"
  timeout?: number;            // Em ms (para if_no_response)
}

// ===== NÓ DO FLUXO (Passo) =====
export interface FlowStepNode {
  id: string;
  type: StepAction;

  // Posição no canvas (ReactFlow)
  position: { x: number; y: number };

  // Dados do passo
  data: {
    label: string;                   // Nome amigável do passo
    messages: Message[];             // O que a IA deve dizer
    icon?: string;                   // Emoji do tipo
    color?: string;                  // Cor do bloco
  };

  // Validações antes de executar
  preValidation?: PreValidation;

  // Decisões (saídas do nó)
  decisions: Decision[];

  // Regras especiais
  maxAttempts?: number;              // Quantas vezes repetir
  isTerminal?: boolean;              // É o último passo?
  fallbackStepId?: string;           // Para onde ir se falhar
}

// ===== CONFIGURAÇÃO COMPLETA DO FLUXO =====
export interface ConversationFlow {
  flowId: string;
  flowName: string;
  version: string;

  // Configurações do agente
  agent: {
    name: string;
    personality: string;
    company: string;
    objective: string;
  };

  // Variáveis do fluxo
  variables: {
    name: string;
    type: "string" | "boolean" | "number" | "date";
    default?: any;
  }[];

  // Passos do fluxo
  steps: FlowStepNode[];

  // Passo inicial
  entryPoint: string;

  // Regras globais
  globalRules: {
    antiLoop: {
      maxSameStepRepeat: number;
      contextMemory: number;
    };
    communication: {
      prohibitedPhrases: string[];
      tone: string;
      maxConsecutiveMessages: number;
    };
  };
}

// ===== ERROS DE VALIDAÇÃO =====
export interface FlowValidationError {
  type:
    | "INFINITE_LOOP"
    | "NO_EXIT"
    | "ORPHAN_NODE"
    | "DUPLICATE_QUESTION"
    | "MISSING_ENTRY_POINT"
    | "INVALID_CONNECTION";
  severity: "error" | "warning";
  nodes: string[];           // IDs dos nós afetados
  message: string;           // Mensagem amigável
  suggestion?: string;       // Sugestão de correção
}

// ===== TIPOS PARA O REACTFLOW =====
export interface CustomNodeData {
  label: string;
  messages: Message[];
  stepType: StepAction;
  hasErrors: boolean;
  isTerminal: boolean;
  decisions: Decision[];
  onEdit: () => void;
  onDelete: () => void;
}

export interface CustomEdgeData {
  decisionType: DecisionType;
  condition: string;
  onEdit: () => void;
  onDelete: () => void;
}

// ===== TEMPLATES POR INDÚSTRIA =====
export interface IndustryTemplate {
  id: string;
  name: string;
  industry: "ECOMMERCE" | "LEGAL" | "SUPPORT" | "OTHER";
  icon: string;
  description: string;
  flow: ConversationFlow;
}
