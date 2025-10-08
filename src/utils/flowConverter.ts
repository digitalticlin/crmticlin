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

        // Validação (se existir)
        ...(node.data.validation?.check_context && {
          validacao: {
            verificar_antes_de_executar: node.data.validation.check_context,
            verificar_no_contexto: node.data.validation.check_field,
            ...(node.data.validation.skip_if_done && {
              se_ja_feito: {
                pular_para: node.data.validation.skip_to_step || '',
                motivo: 'já executado anteriormente'
              }
            })
          }
        }),

        instrucoes: {
          objetivo: node.data.description || '',
          o_que_fazer: getOQueFazer(node.data.type),

          // Para bloco INÍCIO: múltiplas mensagens
          ...(isStartStep && {
            mensagens_da_ia: (node.data.messages || []).map((m: any) => ({
              tipo: m.type === 'text' ? 'texto' : m.type === 'media' ? 'midia' : m.type,
              conteudo: m.content || '',
              aguardar_segundos: m.delay || 0,
              ...(m.media_id && { media_id: m.media_id }),
              ...(m.link_url && { link_url: m.link_url })
            }))
          }),

          // Para ask_question: pergunta única
          ...(node.data.type === 'ask_question' && node.data.messages?.[0] && {
            pergunta: node.data.messages[0].content
          }),

          // Para send_message: mensagem única
          ...(node.data.type === 'send_message' && node.data.messages?.[0] && {
            mensagem_principal: node.data.messages[0].content
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

          // Dados extras do bloco
          ...(node.data.block_data && Object.keys(node.data.block_data).length > 0 && {
            dados_extras: node.data.block_data
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
    'branch_decision': 'tomar_decisao_baseada_em_condicoes',
    'check_if_done': 'verificar_se_etapa_foi_concluida',
    'retry_with_variation': 'tentar_novamente_com_variacao',
    'end_conversation': 'finalizar_conversa',
    'transfer_human': 'transferir_para_atendente_humano',
    'teach': 'ensinar_informacao_ao_agente'
  };

  return mapeamento[blockType] || 'executar_acao';
}

// 🆕 NOVA: Determinar action.type baseado no block_type
function getActionType(blockType: string): 'send_and_wait' | 'send_only' | 'decision' | 'update_data' | 'end' {
  const sendAndWait = ['ask_question', 'request_document', 'validate_document', 'start'];
  const decision = ['branch_decision', 'check_if_done', 'retry_with_variation'];
  const updateData = ['update_lead_data', 'move_lead_in_funnel'];
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

      // 🆕 NOVO FORMATO 100% PT
      if (isNovoFormato) {
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
        const decisions = (variation.instrucoes.decisoes || variation.instrucoes.decisoes_diretas || []).map((d: any) => ({
          id: `d${d.numero}`,
          type: d.tipo === 'resposta_usuario' ? 'if_user_says' : d.tipo === 'timeout' ? 'timeout' : 'condition',
          condition: d.se_cliente_falar || d.se_lead_falar || d.se_lead || '',
          action: d.acao,
          priority: d.prioridade === 'alta' ? 0 : d.prioridade === 'média' ? 1 : 2
        }));

        const nodeData = {
          label: variation.variacao_nome,
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
            max_attempts: variation.controle.tentativas_maximas,
            is_required: variation.controle.campo_obrigatorio,
            timeout_seconds: variation.controle.timeout_segundos
          },
          designStyle: 'glass'
        };

        console.log(`🔨 Reconstruindo node ${nodeId} (100% PT):`, nodeData);

        nodes.push({
          id: nodeId,
          type: 'custom',
          data: nodeData,
          position: variation._metadata.posicao_canvas
        });

      } else {
        // FORMATO ANTIGO
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

        console.log(`🔨 Reconstruindo node ${nodeId} (FORMATO ANTIGO):`, nodeData);

        nodes.push({
          id: nodeId,
          type: 'custom',
          data: nodeData,
          position: variation.position
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
