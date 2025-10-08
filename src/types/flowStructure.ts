// Estrutura JSONB Padronizada para Flow Builder
// Permite ao agente IA entender posição, validar e navegar no fluxo

export interface FlowMetadata {
  version: string;
  created_at: string;
  updated_at: string;
}

export interface StepValidation {
  check_context: boolean;
  check_field?: string;
  skip_if_done: boolean;
  skip_to_step?: string;            // PASSO B, PASSO C...
}

export interface MessageContent {
  type: 'text' | 'media' | 'link' | 'document';
  content: string;
  delay: number;
  media_id?: string;
  link_url?: string;
}

export interface StepDecision {
  id: string;
  type: 'if_user_says' | 'condition' | 'timeout';
  condition: string;
  action?: string | null;
  action_label: string;             // "VÁ PARA O PASSO C1", "IR PARA PASSO B2"
  target_step: string;              // PASSO B, PASSO C...
  target_variation?: string;        // PASSO B1, PASSO B2...
  priority: number;
}

export interface BlockData {
  // ask_question
  question?: string;
  expect_response?: boolean;
  options?: string[];

  // send_message
  message?: string;

  // request_document
  document_type?: string;
  check_if_sent?: boolean;

  // send_link
  link_url?: string;
  link_title?: string;

  // send_media
  media_id?: string;
  media_caption?: string;

  // update_lead_data
  field_updates?: Array<{ field: string; value: string }>;

  // move_lead_in_funnel
  funnel_id?: string;
  stage_id?: string;
  send_message?: boolean;

  // check_if_done / retry_with_variation
  reference_step?: string;

  // branch_decision
  decision_context?: string;
}

export interface StepControl {
  max_attempts: number | null;
  is_required: boolean;
  timeout_seconds: number | null;
}

// 🆕 NOVA: Interface para padronizar ações
export interface ActionData {
  type: 'send_and_wait' | 'send_only' | 'decision' | 'update_data' | 'end';
  data: any; // Campos específicos de cada tipo de bloco
}

export interface StepVariation {
  variation_id: string;           // PASSO A1, PASSO A2, PASSO B1, PASSO B2...
  variation_name: string;
  block_type: string;              // ask_question, send_message, etc.
  position: { x: number; y: number };
  old_node_id?: string;            // ✅ ID original do ReactFlow para mapear edges

  // 🆕 NOVO: Campo action para padronizar
  action: ActionData;

  // ✅ Mantidos para retrocompatibilidade (serão movidos para action.data)
  validation?: StepValidation;
  messages: MessageContent[];
  decisions: StepDecision[];
  block_data: BlockData;
  control: StepControl;
  description: string;
}

export interface FlowStep {
  step_id: string;                 // PASSO A, PASSO B, PASSO C, PASSO D...
  step_name: string;
  variations: StepVariation[];
}

export interface CanvasData {
  nodes: any[];  // ReactFlow nodes
  edges: any[];  // ReactFlow edges
}

export interface StructuredFlow {
  flow_metadata: FlowMetadata;
  steps: FlowStep[];
  edges?: any[];  // ✅ Edges salvas para reconstruir conexões
  canvas?: CanvasData;  // Opcional - usado apenas como fallback
}

// 🆕 INTERFACES MARKDOWN EM PORTUGUÊS (100% PT)

export interface ValidacaoPasso {
  verificar_antes_de_executar: boolean;
  verificar_no_contexto?: string;
  se_ja_feito?: {
    pular_para: string;          // "PASSO B", "PASSO C"...
    motivo: string;
  };
}

export interface MensagemIA {
  tipo: 'texto' | 'midia' | 'link' | 'documento';
  conteudo: string;
  aguardar_segundos?: number;
  media_id?: string;
  link_url?: string;
}

export interface DecisaoIA {
  numero: number;
  se_lead?: string;              // "fornece nome", "confirma situação"...
  se_lead_falar?: string;        // "cancelei", "parei de pagar"...
  se_cliente_falar?: string;     // Alias para se_lead_falar
  acao?: string;                 // "RESPONDER brevemente", "EXPLICAR"...
  entao_ir_para: string;         // "PASSO B", "PASSO C"...
  prioridade?: 'alta' | 'média' | 'baixa';
  tipo?: 'resposta_usuario' | 'timeout' | 'condicao';
  comportamento?: string;        // "RESPOSTA COMPLETA - IR DIRETO"
  sem_confirmacao?: boolean;     // true = não fazer confirmações robóticas
  observacao?: string;           // "sem nome", "qualquer resposta"
}

export interface InstrucoesBloco {
  objetivo: string;                         // Descrição do que este bloco faz
  o_que_fazer: string;                      // "enviar_mensagem_e_aguardar_resposta"...
  mensagem_principal?: string | {           // String simples ou objeto condicional
    com_nome?: string;
    sem_nome?: string;
  };
  pergunta?: string;                        // Para blocos ask_question
  mensagens_da_ia?: MensagemIA[];          // Para bloco INÍCIO (múltiplas)
  decisoes?: DecisaoIA[];                  // Renomeado de avaliar_resposta_do_cliente
  decisoes_diretas?: DecisaoIA[];          // Para decisões sem sub-perguntas
  regra_critica?: string;                  // Regra absoluta que não pode quebrar
  importante?: string;                     // Aviso importante
  dados_extras?: any;                      // Campos específicos de cada tipo
}

export interface ControleBloco {
  tentativas_maximas: number | null;
  campo_obrigatorio: boolean;
  timeout_segundos?: number | null;
  observacao?: string;                     // "nome é bonus, não obrigatório"
}

export interface MetadataBloco {
  posicao_canvas: { x: number; y: number };
  id_original_node?: string;
  tipo_tecnico: string;                    // "start", "ask_question", etc.
}

export interface VariacaoMarkdown {
  variacao_id: string;                     // "A1", "B1", "B2"...
  variacao_nome: string;                   // Nome descritivo
  validacao?: ValidacaoPasso;
  instrucoes: InstrucoesBloco;
  controle: ControleBloco;
  _metadata: MetadataBloco;
}

export interface PassoMarkdown {
  passo_id: string;                        // "PASSO A", "PASSO B"...
  passo_nome: string;                      // Nome descritivo
  condicao?: string;                       // "Primeira interação", "Após contato"
  variacoes: VariacaoMarkdown[];
}

export interface ConexaoFluxo {
  id: string;
  origem: string;                          // ID da variação de origem
  destino: string;                         // ID da variação de destino
  condicao?: string;                       // Condição para seguir essa conexão
  tipo?: string;                           // "fluxo_principal", "decisao", "fallback"
}

export interface InformacoesFluxo {
  versao: string;
  criado_em: string;
  atualizado_em: string;
}

export interface FluxoMarkdown {
  passos: PassoMarkdown[];
  conexoes: ConexaoFluxo[];
  informacoes_fluxo: InformacoesFluxo;
}
