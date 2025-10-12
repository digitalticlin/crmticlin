import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomStepNode } from '@/components/flow-builder/CustomStepNode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  FileText,
  Send,
  GitBranch,
  CheckCircle,
  GraduationCap,
  Search,
  RotateCcw,
  UserCog,
  Target,
  Phone,
  Sparkles,
  Link as LinkIcon,
  Image,
  Clock,
} from 'lucide-react';

import { FlowStepNode, StepAction } from '@/types/flowBuilder';

// Importar editores
import { PresentationEditor } from '@/components/flow-builder/editors/PresentationEditor';
import { AskQuestionEditor } from '@/components/flow-builder/editors/AskQuestionEditor';
import { SendMessageEditor } from '@/components/flow-builder/editors/SendMessageEditor';
import { RequestDocumentEditor } from '@/components/flow-builder/editors/RequestDocumentEditor';
import { TeachEditor } from '@/components/flow-builder/editors/TeachEditor';
import { ValidateDocumentEditor } from '@/components/flow-builder/editors/ValidateDocumentEditor';
import { DecisionEditor } from '@/components/flow-builder/editors/DecisionEditor';
import { CheckIfDoneEditor } from '@/components/flow-builder/editors/CheckIfDoneEditor';
import { RetryVariationEditor } from '@/components/flow-builder/editors/RetryVariationEditor';
import { UpdateLeadEditor } from '@/components/flow-builder/editors/UpdateLeadEditor';
import { MoveFunnelEditor } from '@/components/flow-builder/editors/MoveFunnelEditor';
import { WaitActionEditor } from '@/components/flow-builder/editors/WaitActionEditor';
import { TransferHumanEditor } from '@/components/flow-builder/editors/TransferHumanEditor';
import { EndConversationEditor } from '@/components/flow-builder/editors/EndConversationEditor';
import { SendLinkEditor } from '@/components/flow-builder/editors/SendLinkEditor';
import { SendMediaEditor } from '@/components/flow-builder/editors/SendMediaEditor';

const nodeTypes: NodeTypes = {
  stepNode: CustomStepNode,
};

const SPECIAL_BLOCK = {
  type: 'initial_presentation',
  icon: <Sparkles className="h-4 w-4" />,
  label: '👋 Apresentação Inicial',
  color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  category: 'Especial',
};

const BLOCK_TYPES = [
  // COMUNICAÇÃO
  { type: 'ask_question', icon: <MessageSquare className="h-4 w-4" />, label: 'Fazer Pergunta', color: 'bg-blue-500', category: 'Comunicação' },
  { type: 'request_document', icon: <FileText className="h-4 w-4" />, label: 'Solicitar Documento', color: 'bg-orange-500', category: 'Comunicação' },
  { type: 'send_message', icon: <Send className="h-4 w-4" />, label: 'Enviar Mensagem', color: 'bg-purple-500', category: 'Comunicação' },
  { type: 'send_link', icon: <LinkIcon className="h-4 w-4" />, label: 'Enviar Link', color: 'bg-cyan-500', category: 'Comunicação' },
  { type: 'send_media', icon: <Image className="h-4 w-4" />, label: 'Enviar Mídia', color: 'bg-pink-500', category: 'Comunicação' },
  { type: 'provide_instructions', icon: <GraduationCap className="h-4 w-4" />, label: 'Ensinar/Orientar', color: 'bg-indigo-500', category: 'Comunicação' },

  // LÓGICA
  { type: 'validate_document', icon: <Search className="h-4 w-4" />, label: 'Validar Documento', color: 'bg-red-500', category: 'Lógica' },
  { type: 'branch_decision', icon: <GitBranch className="h-4 w-4" />, label: 'Decisão', color: 'bg-yellow-500', category: 'Lógica' },
  { type: 'check_if_done', icon: <Search className="h-4 w-4" />, label: 'Verificar Se Já Fez', color: 'bg-teal-500', category: 'Lógica' },
  { type: 'retry_with_variation', icon: <RotateCcw className="h-4 w-4" />, label: 'Repetir com Variação', color: 'bg-pink-500', category: 'Lógica' },

  // CRM
  { type: 'update_lead_data', icon: <UserCog className="h-4 w-4" />, label: 'Atualizar Dados do Lead', color: 'bg-cyan-500', category: 'CRM' },
  { type: 'move_lead_in_funnel', icon: <Target className="h-4 w-4" />, label: 'Mover Lead no Funil', color: 'bg-emerald-600', category: 'CRM' },

  // CONTROLE
  { type: 'transfer_to_human', icon: <FaWhatsapp className="h-4 w-4" />, label: 'Avisar Humano', color: 'bg-purple-600', category: 'Controle' },
  { type: 'wait_for_action', icon: <Clock className="h-4 w-4" />, label: 'Aguardar Ação', color: 'bg-gray-500', category: 'Controle' },
  { type: 'end_conversation', icon: <CheckCircle className="h-4 w-4" />, label: 'Finalizar Conversa', color: 'bg-green-500', category: 'Controle' },
];

interface Step4FlowProps {
  data: {
    nodes: Node[];
    edges: Edge[];
    entryPointId: string;
  };
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onBack: () => void;
}

export const Step4Flow = ({ data, onChange, onSave, onBack }: Step4FlowProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowStepNode>(data.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges || []);
  const [editingNode, setEditingNode] = useState<FlowStepNode | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [entryPointId, setEntryPointId] = useState<string>(data.entryPointId || '');

  // Sincronizar mudanças com parent
  useEffect(() => {
    onChange('nodes', nodes);
  }, [nodes]);

  useEffect(() => {
    onChange('edges', edges);
  }, [edges]);

  useEffect(() => {
    onChange('entryPointId', entryPointId);
  }, [entryPointId]);

  const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Adicionar bloco de apresentação inicial se vazio
  useEffect(() => {
    if (nodes.length === 0) {
      const presentationId = generateId();
      const presentationNode: Node<FlowStepNode['data']> = {
        id: presentationId,
        type: 'stepNode',
        position: { x: 250, y: 100 },
        data: {
          label: '👋 Apresentação Inicial',
          messages: [
            {
              type: 'text',
              content: 'Oi! Sou a {nome_agente}, da {empresa}.\nQual o seu nome?'
            }
          ],
          stepType: 'initial_presentation',
          hasErrors: false,
          isTerminal: false,
          decisions: [],
          onEdit: () => handleEditNode(presentationId),
          onDelete: () => handleDeleteNode(presentationId),
        },
      };

      setNodes([presentationNode as any]);
      setEntryPointId(presentationId);
    }
  }, []);

  const handleAddNode = useCallback(
    (stepType: StepAction) => {
      const newNodeId = generateId();
      const newNode: Node<FlowStepNode['data']> = {
        id: newNodeId,
        type: 'stepNode',
        position: { x: 250, y: nodes.length * 150 + 50 },
        data: {
          label: `Novo passo ${nodes.length + 1}`,
          messages: [],
          stepType,
          hasErrors: false,
          isTerminal: stepType === 'end_conversation',
          decisions: [],
          onEdit: () => handleEditNode(newNodeId),
          onDelete: () => handleDeleteNode(newNodeId),
        },
      };

      setNodes((nds) => [...nds, newNode as any]);
    },
    [nodes, setNodes]
  );

  const handleEditNode = useCallback(
    (nodeId: string) => {
      setNodes((currentNodes) => {
        const node = currentNodes.find((n) => n.id === nodeId);
        if (node) {
          setEditingNode(node as FlowStepNode);
          setIsEditorOpen(true);
        }
        return currentNodes;
      });
    },
    []
  );

  const handleSaveNode = useCallback(
    (updatedData: Partial<FlowStepNode['data']>) => {
      if (!editingNode) return;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNode.id
            ? {
                ...node,
                data: { ...node.data, ...updatedData },
              }
            : node
        )
      );

      setIsEditorOpen(false);
      setEditingNode(null);
    },
    [editingNode, setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

      if (entryPointId === nodeId) {
        setEntryPointId('');
      }
    },
    [setNodes, setEdges, entryPointId]
  );

  // Atualizar callbacks dos nodes
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: () => handleEditNode(node.id),
          onDelete: () => handleDeleteNode(node.id),
        },
      }))
    );
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge_${params.source}_${params.target}_${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3B82F6', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div className="w-full h-[calc(100vh-250px)] flex gap-4">
      {/* Sidebar Esquerda - Paleta */}
      <Card className="w-64 flex-shrink-0 overflow-y-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Blocos do Fluxo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3">
          {/* Bloco Especial */}
          <div className="relative">
            <h3 className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              ⭐ RECOMENDADO
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs h-10 border-2 border-orange-300 bg-gradient-to-r from-yellow-50 to-orange-50"
              onClick={() => handleAddNode(SPECIAL_BLOCK.type as StepAction)}
            >
              <div className={`p-1.5 rounded ${SPECIAL_BLOCK.color} text-white`}>
                {SPECIAL_BLOCK.icon}
              </div>
              <span className="truncate text-xs">{SPECIAL_BLOCK.label}</span>
            </Button>
          </div>

          {/* Comunicação */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-2">💬 COMUNICAÇÃO</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'Comunicação').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs h-8"
                  onClick={() => handleAddNode(block.type as StepAction)}
                >
                  <div className={`p-1 rounded ${block.color} text-white`}>{block.icon}</div>
                  <span className="truncate text-xs">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Lógica */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-2">🔍 LÓGICA</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'Lógica').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs h-8"
                  onClick={() => handleAddNode(block.type as StepAction)}
                >
                  <div className={`p-1 rounded ${block.color} text-white`}>{block.icon}</div>
                  <span className="truncate text-xs">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* CRM */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-2">📊 CRM</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'CRM').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs h-8"
                  onClick={() => handleAddNode(block.type as StepAction)}
                >
                  <div className={`p-1 rounded ${block.color} text-white`}>{block.icon}</div>
                  <span className="truncate text-xs">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Controle */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-2">⚙️ CONTROLE</h3>
            <div className="space-y-1">
              {BLOCK_TYPES.filter(b => b.category === 'Controle').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs h-8"
                  onClick={() => handleAddNode(block.type as StepAction)}
                >
                  <div className={`p-1 rounded ${block.color} text-white`}>{block.icon}</div>
                  <span className="truncate text-xs">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Principal */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Editores (todos os tipos) */}
      {editingNode?.data.stepType === 'initial_presentation' && (
        <PresentationEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'ask_question' && (
        <AskQuestionEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            decisions: editingNode.data.decisions,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'send_message' && (
        <SendMessageEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'request_document' && (
        <RequestDocumentEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            decisions: editingNode.data.decisions,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'provide_instructions' && (
        <TeachEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'validate_document' && (
        <ValidateDocumentEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            decisions: editingNode.data.decisions,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'branch_decision' && (
        <DecisionEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            decisions: editingNode.data.decisions,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'check_if_done' && (
        <CheckIfDoneEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            decisions: editingNode.data.decisions,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'retry_with_variation' && (
        <RetryVariationEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'update_lead_data' && (
        <UpdateLeadEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'move_lead_in_funnel' && (
        <MoveFunnelEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'wait_for_action' && (
        <WaitActionEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'transfer_to_human' && (
        <TransferHumanEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'end_conversation' && (
        <EndConversationEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'send_link' && (
        <SendLinkEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {editingNode?.data.stepType === 'send_media' && (
        <SendMediaEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingNode(null);
          }}
          initialData={{
            label: editingNode.data.label,
            messages: editingNode.data.messages as any,
            description: editingNode.data.description
          }}
          onSave={(data) => handleSaveNode(data)}
        />
      )}

      {/* Botões de Navegação Fixos */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-6 h-12 bg-white border-2 border-gray-300"
        >
          ← Voltar
        </Button>
        <Button
          onClick={onSave}
          className="px-8 h-12 bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg"
        >
          ✅ Salvar Agente
        </Button>
      </div>
    </div>
  );
};
