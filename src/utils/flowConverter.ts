import { Node, Edge } from 'reactflow';
import { StructuredFlow, FlowStep, StepVariation, StepDecision } from '@/types/flowStructure';

/**
 * Converte ReactFlow (nodes + edges) para estrutura JSONB padronizada
 * Agrupa blocos em PASSOS (A, B, C...) com variações (A1, A2, B1, B2...)
 */
export function convertReactFlowToStructured(
  nodes: Node[],
  edges: Edge[]
): StructuredFlow {
  const steps: FlowStep[] = [];

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

  // 🔧 CORREÇÃO: Criar PASSOS e VARIAÇÕES corretamente
  nodesByDistance.forEach((nodesAtDistance, distance) => {
    // Se distance=0, é o bloco START
    const isStartStep = distance === 0;
    const stepLetter = isStartStep ? 'INÍCIO' : stepLetters[distance - 1] || `STEP_${distance}`;
    const stepId = isStartStep ? 'INÍCIO' : `PASSO ${stepLetter}`;

    const step: FlowStep = {
      step_id: stepId,
      step_name: isStartStep ? 'Início' : `Passo ${stepLetter}`,
      variations: []
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

      // 🆕 Determinar action.type baseado no block_type
      const actionType = getActionType(node.data.type);

      const variation: StepVariation = {
        variation_id: variationId,
        variation_name: node.data.label || `Variação ${varIdx + 1}`,
        block_type: node.data.type || 'send_message',
        position: node.position,
        old_node_id: node.id, // ✅ Guardar ID original para mapear edges

        // 🆕 NOVO: Campo action padronizado
        action: {
          type: actionType,
          data: {
            messages: node.data.messages || [],
            decisions: nodeDecisions,
            ...node.data.block_data
          }
        },

        // Mantidos para retrocompatibilidade
        validation: node.data.validation || undefined,
        messages: node.data.messages || [{ type: 'text', content: '', delay: 0 }],
        decisions: nodeDecisions,
        block_data: node.data.block_data || {},
        control: {
          max_attempts: node.data.control?.max_attempts || null,
          is_required: node.data.control?.is_required || false,
          timeout_seconds: node.data.control?.timeout_seconds || null
        },
        description: node.data.description || ''
      };

      step.variations.push(variation);
    });

    steps.push(step);
  });

  return {
    flow_metadata: {
      version: '1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    steps,
    // ✅ Salvar edges para reconstruir conexões
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle
    }))
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
  structuredFlow: StructuredFlow
): { nodes: Node[]; edges: Edge[] } {
  if (structuredFlow.canvas?.nodes && structuredFlow.canvas?.edges) {
    // Se já tem canvas salvo, usar direto
    console.log('📌 Usando canvas salvo diretamente');
    return {
      nodes: structuredFlow.canvas.nodes,
      edges: structuredFlow.canvas.edges
    };
  }

  console.log('🔨 Reconstruindo do zero a partir dos steps');

  // Caso contrário, reconstruir do zero
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 0;
  const oldIdToNewId = new Map<string, string>(); // Mapeamento de IDs antigos para novos

  // Converter variações para nodes (incluindo INÍCIO)
  structuredFlow.steps.forEach((step, stepIdx) => {
    console.log(`📝 Processando step: ${step.step_id}`, step);

    step.variations.forEach((variation, varIdx) => {
      nodeIdCounter++;
      const nodeId = `${nodeIdCounter}`;

      // Guardar mapeamento se existir old_node_id
      if ((variation as any).old_node_id) {
        oldIdToNewId.set((variation as any).old_node_id, nodeId);
      }

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

      console.log(`🔨 Reconstruindo node ${nodeId} (${variation.block_type}):`, nodeData);

      nodes.push({
        id: nodeId,
        type: 'custom',
        data: nodeData,
        position: variation.position
      });
    });
  });

  // Reconstruir edges usando mapeamento de IDs
  if (structuredFlow.edges && Array.isArray(structuredFlow.edges)) {
    structuredFlow.edges.forEach((edgeData: any, idx: number) => {
      const sourceId = oldIdToNewId.get(edgeData.source) || edgeData.source;
      const targetId = oldIdToNewId.get(edgeData.target) || edgeData.target;

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

  return { nodes, edges };
}
