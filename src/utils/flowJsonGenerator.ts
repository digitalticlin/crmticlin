import { Node, Edge } from 'reactflow';
import { FlowStepNode } from '@/types/flowBuilder';

/**
 * Gera o JSON no formato RETORNO com PASSO A, B, C
 * Bifurcações são nomeadas como A1, A2, B1, B2, etc.
 */

interface RetornoStep {
  id: string;
  passoName: string; // "PASSO A", "PASSO A1", "PASSO B"
  tipo: string;
  mensagem: string[];
  decisoes: {
    condicao: string;
    proximoPasso: string; // "PASSO B", "PASSO C1"
  }[];
  validacoes?: {
    campo: string;
    operador: string;
    valor?: any;
  }[];
  isTerminal?: boolean;
}

interface RetornoFlow {
  flowId: string;
  flowName: string;
  version: string;
  entryPoint: string; // "PASSO A"
  agente: {
    nome: string;
    empresa: string;
    objetivo: string;
  };
  passos: RetornoStep[];
}

/**
 * Converte um node ID para nome de passo (PASSO A, B, C...)
 */
export const generatePassoName = (
  nodeId: string,
  allNodes: Node[],
  edges: Edge[],
  entryPointId: string
): string => {
  // Encontrar índice baseado na ordem topológica
  const orderedNodes = getTopologicalOrder(allNodes, edges, entryPointId);
  const index = orderedNodes.indexOf(nodeId);

  if (index === -1) return 'PASSO ?';

  // Verificar se é uma bifurcação
  const parentEdges = edges.filter(e => e.target === nodeId);

  if (parentEdges.length > 1) {
    // É um ponto de convergência - usar próxima letra
    const letter = String.fromCharCode(65 + index); // A, B, C...
    return `PASSO ${letter}`;
  }

  // Verificar se o pai tem múltiplas saídas (bifurcação)
  if (parentEdges.length === 1) {
    const parentId = parentEdges[0].source;
    const siblingEdges = edges.filter(e => e.source === parentId);

    if (siblingEdges.length > 1) {
      // É filho de uma bifurcação
      const parentNode = orderedNodes.indexOf(parentId);
      const parentLetter = String.fromCharCode(65 + parentNode);
      const siblingIndex = siblingEdges.findIndex(e => e.target === nodeId);
      return `PASSO ${parentLetter}${siblingIndex + 1}`;
    }
  }

  // Passo normal
  const letter = String.fromCharCode(65 + index); // A, B, C...
  return `PASSO ${letter}`;
};

/**
 * Ordenação topológica dos nós (ordem de execução)
 */
const getTopologicalOrder = (
  nodes: Node[],
  edges: Edge[],
  entryPointId: string
): string[] => {
  const visited = new Set<string>();
  const order: string[] = [];

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    order.push(nodeId);

    // Visitar filhos
    const children = edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);

    children.forEach(childId => dfs(childId));
  };

  dfs(entryPointId);

  return order;
};

/**
 * Converte o fluxo ReactFlow para formato RETORNO
 */
export const convertToRetornoFormat = (
  nodes: Node[],
  edges: Edge[],
  entryPointId: string,
  flowName: string = 'Novo Fluxo',
  agentData?: { nome: string; empresa: string; objetivo: string }
): RetornoFlow => {
  const passos: RetornoStep[] = [];

  // Mapear IDs para nomes de passos
  const passoNameMap = new Map<string, string>();
  nodes.forEach(node => {
    const passoName = generatePassoName(node.id, nodes, edges, entryPointId);
    passoNameMap.set(node.id, passoName);
  });

  // Converter cada nó
  nodes.forEach(node => {
    const data = node.data as FlowStepNode['data'];
    const passoName = passoNameMap.get(node.id) || 'PASSO ?';

    // Encontrar decisões (edges saindo deste nó)
    const outgoingEdges = edges.filter(e => e.source === node.id);

    const decisoes = outgoingEdges.map((edge, idx) => {
      const targetPassoName = passoNameMap.get(edge.target) || 'PASSO ?';

      // Tentar extrair condição do edge (se houver)
      const edgeData = edge.data as any;
      const condicao = edgeData?.condition || (outgoingEdges.length > 1 ? `Opção ${idx + 1}` : 'Sempre');

      return {
        condicao,
        proximoPasso: targetPassoName
      };
    });

    // Extrair mensagens
    const mensagens = data.messages
      .filter(m => m.type === 'text')
      .map(m => (m as any).content);

    passos.push({
      id: node.id,
      passoName,
      tipo: data.stepType,
      mensagem: mensagens,
      decisoes,
      isTerminal: data.isTerminal
    });
  });

  return {
    flowId: `flow_${Date.now()}`,
    flowName,
    version: '1.0',
    entryPoint: passoNameMap.get(entryPointId) || 'PASSO A',
    agente: agentData || {
      nome: 'Assistente',
      empresa: 'Sua Empresa',
      objetivo: 'Ajudar o cliente'
    },
    passos
  };
};

/**
 * Formata o JSON RETORNO de forma legível
 */
export const formatRetornoJson = (flow: RetornoFlow): string => {
  let output = `# FLUXO: ${flow.flowName}\n`;
  output += `# AGENTE: ${flow.agente.nome} da ${flow.agente.empresa}\n`;
  output += `# OBJETIVO: ${flow.agente.objetivo}\n\n`;
  output += `# ENTRADA: ${flow.entryPoint}\n\n`;
  output += `---\n\n`;

  flow.passos.forEach(passo => {
    output += `## ${passo.passoName}\n`;
    output += `**TIPO:** ${passo.tipo}\n\n`;

    if (passo.mensagem.length > 0) {
      output += `**MENSAGEM:**\n`;
      passo.mensagem.forEach(msg => {
        output += `"${msg}"\n`;
      });
      output += `\n`;
    }

    if (passo.decisoes.length > 0) {
      output += `**DECISÕES:**\n`;
      passo.decisoes.forEach(dec => {
        output += `- SE "${dec.condicao}" → vá para o ${dec.proximoPasso}\n`;
      });
      output += `\n`;
    }

    if (passo.isTerminal) {
      output += `**[FIM DA CONVERSA]**\n\n`;
    }

    output += `---\n\n`;
  });

  return output;
};
