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

  // Mapear nodes por ordem de conexão (BFS a partir do start)
  const startNode = nodes.find(n => n.data.type === 'start');
  if (!startNode) {
    throw new Error('Fluxo deve ter um bloco de INÍCIO');
  }

  // Criar letra do passo baseado na posição
  const stepLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let stepIndex = 0;
  let variationCounters: Record<string, number> = {};

  // Ordenar nodes por conexão (BFS)
  const visited = new Set<string>();
  const queue = [startNode.id];
  const orderedNodes: Node[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;

    visited.add(currentId);
    const currentNode = nodes.find(n => n.id === currentId);
    if (currentNode && currentNode.data.type !== 'start') {
      orderedNodes.push(currentNode);
    }

    // Adicionar próximos nodes
    const nextEdges = edges.filter(e => e.source === currentId);
    nextEdges.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    });
  }

  // Agrupar nodes em passos
  orderedNodes.forEach((node, index) => {
    const stepLetter = stepLetters[stepIndex] || `STEP_${stepIndex}`;
    const stepId = `PASSO ${stepLetter}`;

    // Verificar se já existe passo com essa letra
    let currentStep = steps.find(s => s.step_id === stepId);

    if (!currentStep) {
      // Criar novo passo
      currentStep = {
        step_id: stepId,
        step_name: node.data.label || `Passo ${stepLetter}`,
        variations: []
      };
      steps.push(currentStep);
      variationCounters[stepId] = 1;
      stepIndex++;
    }

    // Criar variação
    const variationNumber = variationCounters[stepId] || 1;
    const variationId = `PASSO ${stepLetter}${variationNumber}`;

    // Extrair decisões do node
    const nodeDecisions: StepDecision[] = (node.data.decisions || []).map((d: any, idx: number) => {
      // Encontrar edge correspondente para descobrir target
      const edge = edges.find(e => e.source === node.id && e.sourceHandle === d.outputHandle);
      const targetNode = edge ? nodes.find(n => n.id === edge.target) : null;

      return {
        id: d.id || `d${idx}`,
        type: d.type || 'if_user_says',
        condition: d.condition || '',
        action: d.action || null,
        action_label: targetNode ? `VÁ PARA O ${getNodeStepId(targetNode, nodes, edges, stepLetters)}` : '',
        target_step: targetNode ? getNodeStepId(targetNode, nodes, edges, stepLetters) : '',
        target_variation: targetNode ? getNodeVariationId(targetNode, nodes, edges, stepLetters) : '',
        priority: d.priority || idx
      };
    });

    const variation: StepVariation = {
      variation_id: variationId,
      variation_name: node.data.label || `Variação ${variationNumber}`,
      block_type: node.data.type || 'send_message',
      position: node.position,

      validation: node.data.validation || undefined,

      messages: node.data.messages || [
        { type: 'text', content: '', delay: 0 }
      ],

      decisions: nodeDecisions,

      block_data: node.data.block_data || {},

      control: {
        max_attempts: node.data.control?.max_attempts || null,
        is_required: node.data.control?.is_required || false,
        timeout_seconds: node.data.control?.timeout_seconds || null
      },

      description: node.data.description || ''
    };

    currentStep.variations.push(variation);
    variationCounters[stepId]++;
  });

  return {
    flow_metadata: {
      version: '1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    steps,
    canvas: {
      nodes,
      edges
    }
  };
}

/**
 * Converte estrutura JSONB padronizada para ReactFlow (nodes + edges)
 */
export function convertStructuredToReactFlow(
  structuredFlow: StructuredFlow
): { nodes: Node[]; edges: Edge[] } {
  if (structuredFlow.canvas?.nodes && structuredFlow.canvas?.edges) {
    // Se já tem canvas salvo, usar direto
    return {
      nodes: structuredFlow.canvas.nodes,
      edges: structuredFlow.canvas.edges
    };
  }

  // Caso contrário, reconstruir do zero
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 1;

  // Adicionar node de início
  nodes.push({
    id: '1',
    type: 'custom',
    data: {
      label: 'Início',
      type: 'start',
      description: 'Ponto inicial do fluxo',
      designStyle: 'glass'
    },
    position: { x: 250, y: 100 }
  });

  // Converter variações para nodes
  structuredFlow.steps.forEach((step, stepIdx) => {
    step.variations.forEach((variation, varIdx) => {
      nodeIdCounter++;
      const nodeId = `${nodeIdCounter}`;

      nodes.push({
        id: nodeId,
        type: 'custom',
        data: {
          label: variation.variation_name,
          type: variation.block_type,
          description: variation.description,
          messages: variation.messages,
          decisions: variation.decisions,
          block_data: variation.block_data,
          validation: variation.validation,
          control: variation.control,
          designStyle: 'glass'
        },
        position: variation.position
      });
    });
  });

  return { nodes, edges };
}

// Funções auxiliares
function getNodeStepId(node: Node, nodes: Node[], edges: Edge[], stepLetters: string[]): string {
  // Calcular distância do início (BFS)
  const startNode = nodes.find(n => n.data.type === 'start');
  if (!startNode) return 'PASSO A';

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

  const distance = distances.get(node.id) || 0;
  const stepLetter = stepLetters[distance] || `STEP_${distance}`;
  return `PASSO ${stepLetter}`;
}

function getNodeVariationId(node: Node, nodes: Node[], edges: Edge[], stepLetters: string[]): string {
  const stepId = getNodeStepId(node, nodes, edges, stepLetters);
  const stepLetter = stepId.replace('PASSO ', '');
  return `${stepId}1`; // Simplificado, retorna primeira variação
}
