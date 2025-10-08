import { Node, Edge } from 'reactflow';
import {
  StructuredFlow, FlowStep, StepVariation, StepDecision,
  FluxoMarkdown, PassoMarkdown, VariacaoMarkdown, ConexaoFluxo
} from '@/types/flowStructure';

/**
 * Converte ReactFlow (nodes + edges) para estrutura JSONB 100% PT Markdown
 * Agrupa blocos em PASSOS (A, B, C...) com variações (A1, A2, B1, B2...)
 */
export function convertReactFlowToStructured(
  nodes: Node[],
  edges: Edge[]
): any {
  const passos: PassoMarkdown[] = [];

  // Encontrar node de início
  const startNode = nodes.find(n => n.data.type === 'start');
  if (!startNode) {
    throw new Error('Fluxo deve ter um bloco de INÍCIO');
  }

  const stepLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // 🔧 CORREÇÃO: Calcular distância BFS de cada node
  const distances = calculateBFSDistances(nodes, edges, startNode);

  // 🔧 CORREÇÃO: Agrupar nodes pela MESMA distância (incluindo START)
  const nodesByDistance = groupNodesByDistance(nodes, distances, true);

  // 🔧 CORREÇÃO: Criar PASSOS e VARIAÇÕES corretamente (100% PT)
  nodesByDistance.forEach((nodesAtDistance, distance) => {
    // Se distance=0, é o bloco START
    const isStartStep = distance === 0;
    const stepLetter = isStartStep ? 'INÍCIO' : stepLetters[distance - 1] || `STEP_${distance}`;
    const stepId = isStartStep ? 'INÍCIO' : `PASSO ${stepLetter}`;

    const passo: PassoMarkdown = {
      passo_id: stepId,
      passo_nome: isStartStep ? 'Início' : `Passo ${stepLetter}`,
      condicao: isStartStep ? 'Primeira interação da conversa' : undefined,
      variacoes: []
    };

    // Cada node nessa distância é uma VARIAÇÃO do mesmo PASSO
    nodesAtDistance.forEach((node, varIdx) => {
      const variationId = isStartStep ? 'INÍCIO' : `PASSO ${stepLetter}${varIdx + 1}`;

      // DEBUG: Ver dados do node
      if (isStartStep) {
        console.log('🔍 DEBUG - Node START:', {
          id: node.id,
          label: node.data.label,
          description: node.data.description,
          messages: node.data.messages,
          decisions: node.data.decisions
        });
      }

      // Extrair decisões do node
      const nodeDecisions: StepDecision[] = (node.data.decisions || []).map((d: any, idx: number) => {
        const edge = edges.find(e => e.source === node.id && e.sourceHandle === d.outputHandle);
        const targetNode = edge ? nodes.find(n => n.id === edge.target) : null;

        return {
          id: d.id || `d${idx}`,
          type: d.type || 'if_user_says',
          condition: d.condition || '',
          action: d.action || null,
          action_label: targetNode ? `VÁ PARA O ${getNodeStepLabel(targetNode, distances, stepLetters)}` : '',
          target_step: targetNode ? getNodeStepLabel(targetNode, distances, stepLetters) : '',
          target_variation: targetNode ? getNodeVariationLabel(targetNode, distances, stepLetters, nodesAtDistance) : '',
          priority: d.priority || idx
        };
      });

      // 🆕 CRIAR VARIAÇÃO NO FORMATO MARKDOWN PT (todos os blocos)
      const variacao: VariacaoMarkdown = {
        variacao_id: isStartStep ? 'INÍCIO' : `${stepLetter}${varIdx + 1}`,
        variacao_nome: node.data.label || `Variação ${varIdx + 1}`,

        // Validação (sempre presente - pelo menos básica)
        validacao: node.data.validation?.check_context ? {
          verificar_antes_de_executar: node.data.validation.check_context,
          verificar_no_contexto: node.data.validation.check_field || '',
          ...(node.data.validation.skip_if_done && {
            se_ja_feito: {
              pular_para: node.data.validation.skip_to_step || '',
              motivo: 'já executado anteriormente'
            }
          })
        } : {
          verificar_antes_de_executar: false,
          verificar_no_contexto: '',
          se_ja_feito: undefined
        },

        instrucoes: {
          objetivo: node.data.description || '',
          o_que_fazer: getOQueFazer(node.data.type),

          // 🆕 MENSAGENS DA IA (UNIFICADO - todos os blocos usam)
          ...(node.data.messages && node.data.messages.length > 0 && {
            mensagens_da_ia: (node.data.messages || []).map((m: any) => {
              const mensagem: any = {
                tipo: getTipoMensagem(node.data.type),
                conteudo: m.content || ''
              };

              // Bloco ENVIAR MÍDIA: incluir media_id
              if (m.media_id) {
                mensagem.media_id = m.media_id;
              }

              // Bloco ENVIAR LINK: garantir https:// no link_url
              if (m.link_url) {
                const linkUrl = m.link_url.trim();
                mensagem.link_url = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
                  ? linkUrl
                  : `https://${linkUrl}`;
              }

              return mensagem;
            })
          }),

          // Decisões
          ...(nodeDecisions.length > 0 && {
            decisoes: nodeDecisions.map((d, idx) => ({
              numero: idx + 1,
              se_cliente_falar: d.condition,
              entao_ir_para: d.target_step,
              prioridade: d.priority === 0 ? 'alta' : d.priority === 1 ? 'média' : 'baixa',
              tipo: d.type === 'if_user_says' ? 'resposta_usuario' : d.type === 'timeout' ? 'timeout' : 'condicao'
            }))
          }),

          // Regras específicas por tipo de bloco
          regra_critica: node.data.regra_critica || getRegraCritica(node.data.type),
          importante: node.data.importante || getImportante(node.data.type),

          // Dados extras do bloco
          ...(node.data.block_data && Object.keys(node.data.block_data).length > 0 && {
            dados_extras: (() => {
              const extras = { ...node.data.block_data };

              // BLOCO TRANSFER_TO_HUMAN: processar notificação
              if (node.data.type === 'transfer_to_human') {
                extras.modo_ia = 'tool_execution';
                extras.tool_name = 'update_lead_data';

                // Field updates para mover no funil
                extras.field_updates = [
                  {
                    fieldName: 'funnel_id',
                    fieldValue: `{{${extras.funnelId}}}`
                  },
                  {
                    fieldName: 'kanban_stage_id',
                    fieldValue: `{{${extras.kanbanStageId}}}`
                  },
                  {
                    fieldName: 'notes',
                    fieldValue: `Transferido via automação - {{timestamp}}`
                  }
                ];

                // Configuração de notificação
                if (extras.notifyEnabled) {
                  extras.transfer_to_human = {
                    enabled: true,
                    phone: extras.notifyPhone || null,
                    group_id: extras.notifyGroupId || null,
                    message: `🔔 Novo lead aguardando atendimento humano na etapa ${extras.kanbanStageId}`
                  };
                }

                // Limpar campos temporários do modal
                delete extras.funnelId;
                delete extras.kanbanStageId;
                delete extras.notifyEnabled;
                delete extras.notifyPhone;
                delete extras.notifyGroupId;
              }

              // BLOCO PROVIDE_INSTRUCTIONS: processar ensino
              if (node.data.type === 'provide_instructions') {
                extras.modo_ia = 'knowledge_storage';
                extras.tipo_conhecimento = extras.knowledgeType || 'geral';
                extras.topico = node.data.label || 'Conhecimento geral';
                extras.conteudo_para_aprender = extras.teachingContent || '';
                extras.contexto_de_uso = node.data.description || 'Usar quando cliente perguntar sobre este tópico';

                // Limpar campos temporários do modal
                delete extras.teachingContent;
                delete extras.knowledgeType;
              }

              // BLOCO BRANCH_DECISION: processar lógica de decisão
              if (node.data.type === 'branch_decision') {
                extras.modo_ia = 'decision_logic';
                extras.tipo_decisao = 'baseada_em_contexto';
                extras.campos_analisados = extras.analyzedFields || ['contexto_geral'];

                // Lógica fallback
                extras.logica_fallback = {
                  se_nenhuma_condicao_atendida: extras.fallbackStep || 'FIM',
                  motivo: 'Nenhuma condição foi satisfeita'
                };

                // Limpar campos temporários do modal
                delete extras.analyzedFields;
                delete extras.fallbackStep;
              }

              // BLOCO CHECK_IF_DONE: processar verificação
              if (node.data.type === 'check_if_done') {
                extras.modo_ia = 'validation_check';
                extras.campo_para_verificar = extras.checkField || '';
                extras.bloco_referencia_id = extras.referenceBlockId || null;
                extras.tipo_verificacao = 'campo_contexto';
                extras.criterio_validacao = {
                  campo_existe: true,
                  campo_nao_vazio: true,
                  valor_especifico: null
                };

                // Limpar campos temporários do modal
                delete extras.checkField;
                delete extras.referenceBlockId;
// BLOCO RETRY_WITH_VARIATION: processar repetição com variação              if (node.data.type === 'retry_with_variation') {                extras.modo_ia = 'retry_variation';                extras.bloco_original_id = extras.retryBlockId || null;                extras.numero_tentativa = extras.attemptNumber || 1;                extras.maximo_tentativas = node.data.control?.max_attempts || 3;                extras.estrategia_variacao = 'mudar_tom';                extras.variacoes_disponiveis = [                  'Deixa eu reformular...',                  'De outro jeito...',                  'Explicando melhor...'                ];                // Limpar campos temporários do modal                delete extras.retryBlockId;                delete extras.attemptNumber;              }
              }

              return extras;
            })()
          })
        },

        controle: {
          tentativas_maximas: node.data.control?.max_attempts || null,
          campo_obrigatorio: node.data.control?.is_required || false,
          timeout_segundos: node.data.control?.timeout_seconds || null
        },

        _metadata: {
          posicao_canvas: node.position,
          id_original_node: node.id,
          tipo_tecnico: node.data.type || 'send_message'
        }
      };

      passo.variacoes.push(variacao);
    });

    passos.push(passo);
  });

  // 🆕 Criar conexões no formato PT
  const conexoes: ConexaoFluxo[] = edges.map((e, idx) => ({
    id: e.id || `c${idx}`,
    origem: e.source,
    destino: e.target,
    tipo: 'fluxo_principal'
  }));

  return {
    passos,
    conexoes,
    informacoes_fluxo: {
      versao: '1.0',
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }
  };
}

// 🆕 NOVA: Calcular distância BFS de cada node
function calculateBFSDistances(nodes: Node[], edges: Edge[], startNode: Node): Map<string, number> {
  const distances = new Map<string, number>();
  const queue = [{ id: startNode.id, dist: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    distances.set(id, dist);

    edges
      .filter(e => e.source === id)
      .forEach(e => queue.push({ id: e.target, dist: dist + 1 }));
  }

  return distances;
}

// 🆕 NOVA: Agrupar nodes pela mesma distância
function groupNodesByDistance(nodes: Node[], distances: Map<string, number>, includeStart: boolean = false): Map<number, Node[]> {
  const groups = new Map<number, Node[]>();

  nodes.forEach(node => {
    // Se não deve incluir START, ignorar
    if (!includeStart && node.data.type === 'start') return;

    const dist = distances.get(node.id) || 0;
    if (!groups.has(dist)) {
      groups.set(dist, []);
    }
    groups.get(dist)!.push(node);
  });

  return groups;
}

// 🆕 NOVA: Mapear block_type para "o_que_fazer" em português
function getOQueFazer(blockType: string): string {
  const mapeamento: Record<string, string> = {
    'start': 'enviar_mensagem_e_aguardar_resposta',
    'ask_question': 'fazer_pergunta_e_aguardar_resposta',
    'send_message': 'apenas_enviar_mensagem',
    'request_document': 'solicitar_documento_e_aguardar',
    'validate_document': 'validar_documento_recebido',
    'send_link': 'enviar_link',
    'send_media': 'enviar_midia',
    'update_lead_data': 'atualizar_dados_do_lead',
    'move_lead_in_funnel': 'mover_lead_no_funil',
    'transfer_to_human': 'notificar_equipe_e_mover_lead',
    'branch_decision': 'tomar_decisao_baseada_em_condicoes',
    'check_if_done': 'verificar_se_etapa_foi_concluida',
    'retry_with_variation': 'tentar_novamente_com_variacao',
    'end_conversation': 'finalizar_conversa',
    'transfer_human': 'transferir_para_atendente_humano',
    'provide_instructions': 'ensinar_informacao_ao_agente',
    'teach': 'ensinar_informacao_ao_agente'
  };

  return mapeamento[blockType] || 'executar_acao';
}

// 🆕 NOVA: Mapear block_type para tipo de mensagem
function getTipoMensagem(blockType: string): string {
  const mapeamento: Record<string, string> = {
    'start': 'apresentacao',
    'ask_question': 'pergunta',
    'send_message': 'explicacao',
    'request_document': 'solicitacao',
    'validate_document': 'confirmacao',
    'send_link': 'explicacao',
    'send_media': 'explicacao',
    'update_lead_data': 'confirmacao',
    'move_lead_in_funnel': 'confirmacao',
    'transfer_to_human': 'despedida',
    'branch_decision': 'nenhum',
    'check_if_done': 'nenhum',
    'retry_with_variation': 'pergunta',
    'end_conversation': 'despedida',
    'transfer_human': 'explicacao',
    'provide_instructions': 'explicacao',
    'teach': 'explicacao'
  };

  return mapeamento[blockType] || 'explicacao';
}

// 🆕 NOVA: Regras críticas específicas por tipo de bloco
function getRegraCritica(blockType: string): string {
  const mapeamento: Record<string, string> = {
    'start': 'Sempre cumprimentar com educação e apresentar objetivo',
    'ask_question': 'Nunca repetir pergunta se já foi respondida',
    'send_message': 'Enviar mensagem clara e objetiva',
    'request_document': 'Especificar formato e tipo de documento solicitado',
    'validate_document': 'Verificar legibilidade, formato e dados corretos',
    'send_link': 'SEMPRE incluir https:// antes do link',
    'send_media': 'Verificar se URL da mídia está acessível',
    'update_lead_data': 'Confirmar dados antes de atualizar',
    'move_lead_in_funnel': 'Verificar se funil e etapa existem',
    'transfer_to_human': 'Avisar lead antes de transferir e notificar equipe',
    'branch_decision': 'Avaliar TODAS as condições na ordem de prioridade antes de decidir',
    'check_if_done': 'SEMPRE verificar no contexto antes de solicitar novamente',
    'retry_with_variation': 'Variar abordagem sem repetir texto anterior exatamente',
    'end_conversation': 'Sempre despedir educadamente',
    'transfer_human': 'Avisar lead sobre transferência',
    'provide_instructions': 'Garantir que informação seja compreensível e armazenável',
    'teach': 'Garantir que informação seja compreensível'
  };
  return mapeamento[blockType] || 'Seguir instruções do objetivo';
}

// 🆕 NOVA: Observações importantes por tipo de bloco
function getImportante(blockType: string): string {
  const mapeamento: Record<string, string> = {
    'start': 'Criar primeiro contato positivo',
    'ask_question': 'Aguardar resposta antes de prosseguir',
    'send_message': 'Manter contexto da conversa',
    'request_document': 'Explicar por que documento é necessário',
    'validate_document': 'Dar feedback claro sobre validação',
    'send_link': 'Link deve ser clicável no WhatsApp',
    'send_media': 'Mídia deve carregar corretamente no WhatsApp',
    'update_lead_data': 'Dados atualizados devem refletir no CRM',
    'move_lead_in_funnel': 'Movimentação deve ser registrada no histórico',
    'transfer_to_human': 'Equipe deve ser notificada imediatamente no WhatsApp',
    'branch_decision': 'Decisão deve ser tomada com base em dados do contexto da conversa',
    'check_if_done': 'Evitar repetir ações que o lead já realizou',
    'retry_with_variation': 'Manter mesmo objetivo mas com palavras e tom diferentes',
    'end_conversation': 'Deixar canal aberto para futuro contato',
    'transfer_human': 'Garantir que equipe foi notificada',
    'provide_instructions': 'Informação deve ser armazenada para uso futuro em conversas',
    'teach': 'Informação deve ser armazenada para uso futuro'
  };
  return mapeamento[blockType] || 'Manter contexto da conversa';
}

// 🆕 NOVA: Determinar action.type baseado no block_type
function getActionType(blockType: string): 'send_and_wait' | 'send_only' | 'decision' | 'update_data' | 'end' {
  const sendAndWait = ['ask_question', 'request_document', 'validate_document', 'start'];
  const decision = ['branch_decision', 'check_if_done', 'retry_with_variation'];
  const updateData = ['update_lead_data', 'move_lead_in_funnel', 'transfer_to_human'];
  const end = ['end_conversation'];

  if (sendAndWait.includes(blockType)) return 'send_and_wait';
  if (decision.includes(blockType)) return 'decision';
  if (updateData.includes(blockType)) return 'update_data';
  if (end.includes(blockType)) return 'end';
  return 'send_only';
}

// 🔧 NOVA: Obter label do passo baseado na distância
function getNodeStepLabel(node: Node, distances: Map<string, number>, stepLetters: string[]): string {
  const distance = distances.get(node.id) || 0;
  const stepLetter = stepLetters[distance - 1] || `STEP_${distance}`;
  return `PASSO ${stepLetter}`;
}

// 🔧 NOVA: Obter label da variação
function getNodeVariationLabel(node: Node, distances: Map<string, number>, stepLetters: string[], nodesAtDistance: Node[]): string {
  const distance = distances.get(node.id) || 0;
  const stepLetter = stepLetters[distance - 1] || `STEP_${distance}`;
  const varIdx = nodesAtDistance.findIndex(n => n.id === node.id);
  return `PASSO ${stepLetter}${varIdx + 1}`;
}

/**
 * Converte estrutura JSONB padronizada para ReactFlow (nodes + edges)
 */
export function convertStructuredToReactFlow(
  structuredFlow: any
): { nodes: Node[]; edges: Edge[] } {
  // Detectar formato: 100% PT novo ou antigo
  const isNovoFormato = structuredFlow.passos !== undefined;
  const steps = isNovoFormato ? structuredFlow.passos : structuredFlow.steps;
  const conexoes = isNovoFormato ? structuredFlow.conexoes : structuredFlow.edges;

  console.log(`🔨 Reconstruindo do zero (formato: ${isNovoFormato ? '100% PT' : 'antigo'})`);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 0;
  const oldIdToNewId = new Map<string, string>();

  // Converter variações para nodes
  steps?.forEach((step: any, stepIdx: number) => {
    console.log(`📝 Processando passo: ${step.passo_id || step.step_id}`, step);

    const variations = isNovoFormato ? step.variacoes : step.variations;
    variations?.forEach((variation: any, varIdx: number) => {
      nodeIdCounter++;
      const nodeId = `${nodeIdCounter}`;

      // Guardar mapeamento de ID antigo
      const oldNodeId = variation._metadata?.id_original_node || variation.old_node_id;
      if (oldNodeId) {
        oldIdToNewId.set(oldNodeId, nodeId);
      }

      // 🆕 DETECTAR SE VARIAÇÃO ESTÁ EM MARKDOWN PT (independente da estrutura raiz)
      const isVariacaoMarkdown = variation.instrucoes !== undefined && variation._metadata !== undefined;

      // 🆕 NOVO FORMATO 100% PT (ou variação markdown em estrutura antiga)
      if (isNovoFormato || isVariacaoMarkdown) {
        // Reconstruir messages baseado no tipo de bloco
        let messages: any[] = [];

        if (variation.instrucoes.mensagens_da_ia) {
          // Bloco INÍCIO: múltiplas mensagens
          messages = variation.instrucoes.mensagens_da_ia.map((m: any) => ({
            type: m.tipo === 'texto' ? 'text' : m.tipo === 'midia' ? 'media' : m.tipo,
            content: m.conteudo,
            delay: m.aguardar_segundos || 0,
            ...(m.media_id && { media_id: m.media_id }),
            ...(m.link_url && { link_url: m.link_url })
          }));
        } else if (variation.instrucoes.pergunta) {
          // Bloco ask_question: pergunta única
          messages = [{ type: 'text', content: variation.instrucoes.pergunta, delay: 0 }];
        } else if (variation.instrucoes.mensagem_principal) {
          // Bloco send_message: mensagem única
          const msg = variation.instrucoes.mensagem_principal;
          const content = typeof msg === 'string' ? msg : msg.sem_nome || '';
          messages = [{ type: 'text', content, delay: 0 }];
        }

        // Reconstruir decisions
        const decisoesArray = variation.instrucoes.decisoes ||
                             variation.instrucoes.decisoes_diretas ||
                             variation.instrucoes.avaliar_resposta_do_cliente ||
                             [];

        const decisions = decisoesArray.map((d: any) => ({
          id: `d${d.numero}`,
          type: d.tipo === 'resposta_usuario' ? 'if_user_says' : d.tipo === 'timeout' ? 'timeout' : 'condition',
          condition: d.se_cliente_falar || d.se_lead_falar || d.se_lead || '',
          action: d.acao,
          priority: d.prioridade === 'alta' ? 0 : d.prioridade === 'média' ? 1 : 2
        }));

        const nodeData = {
          label: variation.variacao_nome || variation.passo?.nome || 'Node',
          type: variation._metadata.tipo_tecnico,
          description: variation.instrucoes.objetivo,
          messages,
          decisions,
          block_data: variation.instrucoes.dados_extras || {},
          validation: variation.validacao ? {
            check_context: variation.validacao.verificar_antes_de_executar,
            check_field: variation.validacao.verificar_no_contexto,
            skip_if_done: !!variation.validacao.se_ja_feito,
            skip_to_step: variation.validacao.se_ja_feito?.pular_para
          } : undefined,
          control: {
            max_attempts: variation.controle?.tentativas_maximas || variation.configuracoes?.maximo_tentativas || null,
            is_required: variation.controle?.campo_obrigatorio || variation.configuracoes?.campo_obrigatorio || false,
            timeout_seconds: variation.controle?.timeout_segundos || variation.configuracoes?.timeout_segundos || null
          },
          designStyle: 'glass'
        };

        const position = variation._metadata?.posicao_canvas || { x: 100, y: 100 };

        console.log(`🔨 Reconstruindo node ${nodeId} (100% PT)`, {
          nodeData,
          position,
          _metadata: variation._metadata
        });

        nodes.push({
          id: nodeId,
          type: 'custom',
          data: nodeData,
          position
        });

      } else {
        // FORMATO ANTIGO
        const position = variation.position || { x: 100, y: 100 };

        const nodeData = {
          label: variation.variation_name,
          type: variation.block_type,
          description: variation.description,
          messages: variation.messages,
          decisions: variation.decisions,
          block_data: variation.block_data,
          validation: variation.validation,
          control: variation.control,
          designStyle: 'glass'
        };

        console.log(`🔨 Reconstruindo node ${nodeId} (FORMATO ANTIGO)`, {
          nodeData,
          position
        });

        nodes.push({
          id: nodeId,
          type: 'custom',
          data: nodeData,
          position
        });
      }
    });
  });

  // Reconstruir edges usando mapeamento de IDs
  if (conexoes && Array.isArray(conexoes)) {
    conexoes.forEach((edgeData: any, idx: number) => {
      const source = edgeData.origem || edgeData.source;
      const target = edgeData.destino || edgeData.target;

      const sourceId = oldIdToNewId.get(source) || source;
      const targetId = oldIdToNewId.get(target) || target;

      edges.push({
        id: edgeData.id || `e${idx}`,
        source: sourceId,
        target: targetId,
        sourceHandle: edgeData.sourceHandle,
        targetHandle: edgeData.targetHandle,
        type: 'default'
      });
    });
    console.log(`🔗 Reconstruídas ${edges.length} conexões`);
  }

  console.log(`✅ Reconstrução completa: ${nodes.length} nodes, ${edges.length} edges`);

  return { nodes, edges };
}
