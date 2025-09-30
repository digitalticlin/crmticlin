import { FlowStepNode, FlowValidationError } from '@/types/flowBuilder';
import { Edge } from 'reactflow';

/**
 * Detecta loops infinitos no fluxo
 */
export const detectInfiniteLoops = (
  nodes: FlowStepNode[],
  edges: Edge[]
): string[][] => {
  const loops: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string, path: string[]): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    // Encontrar todas as conexões de saída deste nó
    const outgoingEdges = edges.filter(edge => edge.source === nodeId);

    for (const edge of outgoingEdges) {
      const targetId = edge.target;

      if (!visited.has(targetId)) {
        if (dfs(targetId, [...path])) {
          return true;
        }
      } else if (recursionStack.has(targetId)) {
        // Loop detectado
        const loopStartIndex = path.indexOf(targetId);
        const loop = path.slice(loopStartIndex);
        loops.push([...loop, targetId]);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  // Iniciar DFS de cada nó não visitado
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return loops;
};

/**
 * Encontra nós sem saída (dead ends) que não são terminais
 */
export const findDeadEnds = (
  nodes: FlowStepNode[],
  edges: Edge[]
): string[] => {
  return nodes
    .filter(node => {
      // Se é terminal, está ok
      if (node.isTerminal) return false;

      // Se não tem conexões de saída, é um dead end
      const hasOutgoing = edges.some(edge => edge.source === node.id);
      return !hasOutgoing;
    })
    .map(node => node.id);
};

/**
 * Encontra nós órfãos (sem entrada, exceto o primeiro)
 */
export const findOrphanNodes = (
  nodes: FlowStepNode[],
  edges: Edge[],
  entryPointId: string
): string[] => {
  return nodes
    .filter(node => {
      // Entry point não é órfão
      if (node.id === entryPointId) return false;

      // Se não tem conexões de entrada, é órfão
      const hasIncoming = edges.some(edge => edge.target === node.id);
      return !hasIncoming;
    })
    .map(node => node.id);
};

/**
 * Detecta perguntas/mensagens duplicadas
 */
export const detectDuplicateMessages = (
  nodes: FlowStepNode[]
): string[][] => {
  const messageMap = new Map<string, string[]>();

  nodes.forEach(node => {
    if (node.data.messages && node.data.messages.length > 0) {
      const firstMessage = node.data.messages[0];
      if (firstMessage.type === 'text') {
        const normalized = firstMessage.content.toLowerCase().trim();
        if (!messageMap.has(normalized)) {
          messageMap.set(normalized, []);
        }
        messageMap.get(normalized)!.push(node.id);
      }
    }
  });

  // Retornar apenas grupos com duplicatas
  return Array.from(messageMap.values()).filter(group => group.length > 1);
};

/**
 * Valida se existe um ponto de entrada
 */
export const validateEntryPoint = (
  nodes: FlowStepNode[],
  entryPointId: string
): boolean => {
  return nodes.some(node => node.id === entryPointId);
};

/**
 * Valida se todas as conexões apontam para nós existentes
 */
export const validateConnections = (
  nodes: FlowStepNode[],
  edges: Edge[]
): string[] => {
  const nodeIds = new Set(nodes.map(n => n.id));
  const invalidEdges: string[] = [];

  edges.forEach(edge => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      invalidEdges.push(edge.id);
    }
  });

  return invalidEdges;
};

/**
 * Validação completa do fluxo
 */
export const validateFlow = (
  nodes: FlowStepNode[],
  edges: Edge[],
  entryPointId: string
): FlowValidationError[] => {
  const errors: FlowValidationError[] = [];

  // 1. Verificar loops infinitos
  const loops = detectInfiniteLoops(nodes, edges);
  if (loops.length > 0) {
    loops.forEach(loop => {
      errors.push({
        type: 'INFINITE_LOOP',
        severity: 'error',
        nodes: loop,
        message: `Loop infinito detectado entre os passos: ${loop.join(' → ')}`,
        suggestion: 'Adicione uma condição de saída ou limite de tentativas'
      });
    });
  }

  // 2. Verificar nós sem saída
  const deadEnds = findDeadEnds(nodes, edges);
  if (deadEnds.length > 0) {
    errors.push({
      type: 'NO_EXIT',
      severity: 'error',
      nodes: deadEnds,
      message: `${deadEnds.length} passo(s) sem saída definida`,
      suggestion: 'Adicione conexões ou marque como passo final'
    });
  }

  // 3. Verificar nós órfãos
  const orphans = findOrphanNodes(nodes, edges, entryPointId);
  if (orphans.length > 0) {
    errors.push({
      type: 'ORPHAN_NODE',
      severity: 'warning',
      nodes: orphans,
      message: `${orphans.length} passo(s) não conectado(s) ao fluxo`,
      suggestion: 'Conecte estes passos ou remova-os'
    });
  }

  // 4. Verificar mensagens duplicadas
  const duplicates = detectDuplicateMessages(nodes);
  if (duplicates.length > 0) {
    duplicates.forEach(group => {
      errors.push({
        type: 'DUPLICATE_QUESTION',
        severity: 'warning',
        nodes: group,
        message: `Mensagem repetida em ${group.length} passos`,
        suggestion: 'Considere reutilizar o mesmo passo ou diferenciar as mensagens'
      });
    });
  }

  // 5. Verificar ponto de entrada
  if (!validateEntryPoint(nodes, entryPointId)) {
    errors.push({
      type: 'MISSING_ENTRY_POINT',
      severity: 'error',
      nodes: [],
      message: 'Ponto de entrada do fluxo não encontrado',
      suggestion: 'Defina qual será o primeiro passo do fluxo'
    });
  }

  // 6. Verificar conexões inválidas
  const invalidConnections = validateConnections(nodes, edges);
  if (invalidConnections.length > 0) {
    errors.push({
      type: 'INVALID_CONNECTION',
      severity: 'error',
      nodes: [],
      message: `${invalidConnections.length} conexão(ões) inválida(s)`,
      suggestion: 'Remova conexões que apontam para passos inexistentes'
    });
  }

  return errors;
};
