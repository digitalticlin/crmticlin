import { useState, useCallback, useMemo, useEffect } from 'react';
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

import { PageHeader } from '@/components/layout/PageHeader';
import { CustomStepNode } from '@/components/flow-builder/CustomStepNode';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  FileText,
  Clock,
  Send,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Download,
  Play,
  Plus,
  GraduationCap,
  Search,
  RotateCcw,
  UserCog,
  Target,
  Phone,
  Sparkles,
  Link as LinkIcon,
  Image,
} from 'lucide-react';

import { FlowStepNode, StepAction, Decision, FlowValidationError, Message } from '@/types/flowBuilder';
import { validateFlow } from '@/utils/flowValidator';
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
import { convertToRetornoFormat, formatRetornoJson } from '@/utils/flowJsonGenerator';

const nodeTypes: NodeTypes = {
  stepNode: CustomStepNode,
};

// Bloco especial de apresentação
const SPECIAL_BLOCK = {
  type: 'initial_presentation',
  icon: <Sparkles className="h-4 w-4" />,
  label: '👋 Apresentação Inicial',
  color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  category: 'Especial',
  description: 'Recomendado como primeiro passo',
  isSpecial: true
};

// Paleta de blocos - 15 tipos organizados por categoria
const BLOCK_TYPES = [
  // === COMUNICAÇÃO ===
  { type: 'ask_question', icon: <MessageSquare className="h-4 w-4" />, label: 'Fazer Pergunta', color: 'bg-blue-500', category: 'Comunicação' },
  { type: 'request_document', icon: <FileText className="h-4 w-4" />, label: 'Solicitar Documento', color: 'bg-orange-500', category: 'Comunicação' },
  { type: 'send_message', icon: <Send className="h-4 w-4" />, label: 'Enviar Mensagem', color: 'bg-purple-500', category: 'Comunicação' },
  { type: 'send_link', icon: <LinkIcon className="h-4 w-4" />, label: 'Enviar Link', color: 'bg-cyan-500', category: 'Comunicação' },
  { type: 'send_media', icon: <Image className="h-4 w-4" />, label: 'Enviar Mídia', color: 'bg-pink-500', category: 'Comunicação' },
  { type: 'provide_instructions', icon: <GraduationCap className="h-4 w-4" />, label: 'Ensinar/Orientar', color: 'bg-indigo-500', category: 'Comunicação' },

  // === LÓGICA ===
  { type: 'validate_document', icon: <Search className="h-4 w-4" />, label: 'Validar Documento', color: 'bg-red-500', category: 'Lógica' },
  { type: 'branch_decision', icon: <GitBranch className="h-4 w-4" />, label: 'Decisão', color: 'bg-yellow-500', category: 'Lógica' },
  { type: 'check_if_done', icon: <Search className="h-4 w-4" />, label: 'Verificar Se Já Fez', color: 'bg-teal-500', category: 'Lógica' },
  { type: 'retry_with_variation', icon: <RotateCcw className="h-4 w-4" />, label: 'Repetir com Variação', color: 'bg-pink-500', category: 'Lógica' },

  // === CRM ===
  { type: 'update_lead_data', icon: <UserCog className="h-4 w-4" />, label: 'Atualizar Dados do Lead', color: 'bg-cyan-500', category: 'CRM' },
  { type: 'move_lead_in_funnel', icon: <Target className="h-4 w-4" />, label: 'Mover Lead no Funil', color: 'bg-emerald-600', category: 'CRM' },

  // === CONTROLE ===
  { type: 'wait_for_action', icon: <Clock className="h-4 w-4" />, label: 'Aguardar Ação', color: 'bg-gray-500', category: 'Controle' },
  { type: 'transfer_to_human', icon: <Phone className="h-4 w-4" />, label: 'Encaminhar para Humano', color: 'bg-orange-600', category: 'Controle' },
  { type: 'end_conversation', icon: <CheckCircle className="h-4 w-4" />, label: 'Finalizar Conversa', color: 'bg-green-500', category: 'Controle' },
];

const DECISION_TYPES = [
  { value: 'if_user_says', label: 'SE o cliente responder' },
  { value: 'if_receives_file', label: 'SE receber arquivo' },
  { value: 'if_no_response', label: 'SE não responder nada' },
  { value: 'always', label: 'Sempre ir para' },
];

export default function FlowBuilderTest() {
  // Estado do ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowStepNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Estado do editor
  const [editingNode, setEditingNode] = useState<FlowStepNode | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Estado de validação
  const [validationErrors, setValidationErrors] = useState<FlowValidationError[]>([]);

  // Entrada do fluxo
  const [entryPointId, setEntryPointId] = useState<string>('');

  // Gerar ID único
  const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Adicionar bloco de apresentação automaticamente ao iniciar
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

  // Adicionar novo nó ao canvas
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

      // Se é o primeiro nó, definir como entry point
      if (nodes.length === 0) {
        setEntryPointId(newNodeId);
      }
    },
    [nodes, setNodes]
  );

  // Editar nó
  const handleEditNode = useCallback(
    (nodeId: string) => {
      console.log('handleEditNode called with:', nodeId);
      setNodes((currentNodes) => {
        const node = currentNodes.find((n) => n.id === nodeId);
        if (node) {
          console.log('Found node:', node);
          setEditingNode(node as FlowStepNode);
          setIsEditorOpen(true);
        } else {
          console.log('Node not found:', nodeId);
        }
        return currentNodes;
      });
    },
    []
  );

  // Salvar edição do nó
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

  // Deletar nó
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      console.log('handleDeleteNode called with:', nodeId);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

      // Se era o entry point, limpar
      if (entryPointId === nodeId) {
        setEntryPointId('');
      }
    },
    [setNodes, setEdges, entryPointId]
  );

  // Atualizar callbacks dos nodes sempre que nodes mudarem
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
  }, []); // Executar apenas uma vez após o mount

  // Conectar nós
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

  // Validar fluxo
  const handleValidate = useCallback(() => {
    const flowSteps: FlowStepNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.data.stepType,
      position: node.position,
      data: node.data,
      decisions: node.data.decisions || [],
      isTerminal: node.data.isTerminal,
    }));

    const errors = validateFlow(flowSteps, edges, entryPointId);
    setValidationErrors(errors);

    // Marcar nós com erro
    setNodes((nds) =>
      nds.map((node) => {
        const hasError = errors.some((err) => err.nodes.includes(node.id));
        return {
          ...node,
          data: { ...node.data, hasErrors: hasError },
        };
      })
    );
  }, [nodes, edges, entryPointId, setNodes]);

  // Exportar JSON
  const handleExportJSON = useCallback(() => {
    // Converter para formato RETORNO
    const retornoFlow = convertToRetornoFormat(
      nodes,
      edges,
      entryPointId,
      'Fluxo de Teste',
      {
        nome: 'Amanda',
        empresa: 'TicLin',
        objetivo: 'Ajudar o cliente com suas necessidades'
      }
    );

    // Gerar JSON estruturado
    const json = JSON.stringify(retornoFlow, null, 2);

    // Gerar versão legível
    const readable = formatRetornoJson(retornoFlow);

    // Exportar JSON
    const jsonBlob = new Blob([json], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = 'flow-config.json';
    jsonLink.click();

    // Exportar texto legível
    const txtBlob = new Blob([readable], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtLink = document.createElement('a');
    txtLink.href = txtUrl;
    txtLink.download = 'flow-readable.txt';
    txtLink.click();
  }, [nodes, edges, entryPointId]);

  return (
    <div className="w-full h-screen flex flex-col">
      <PageHeader
        title="Flow Builder - Teste"
        description="Crie o fluxo conversacional do seu agente de IA"
      />

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Sidebar Esquerda - Paleta */}
        <Card className="w-64 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle className="text-lg">Blocos</CardTitle>
            <CardDescription>Clique para adicionar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bloco Especial - Destaque */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-25"></div>
              <div className="relative">
                <h3 className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  ⭐ RECOMENDADO
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs h-10 border-2 border-orange-300 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 font-semibold"
                  onClick={() => handleAddNode(SPECIAL_BLOCK.type as StepAction)}
                >
                  <div className={`p-1.5 rounded ${SPECIAL_BLOCK.color} text-white shadow-md`}>
                    {SPECIAL_BLOCK.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">{SPECIAL_BLOCK.label}</div>
                    <div className="text-[10px] text-gray-500">{SPECIAL_BLOCK.description}</div>
                  </div>
                </Button>
              </div>
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
                    <span className="truncate">{block.label}</span>
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
                    <span className="truncate">{block.label}</span>
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
                    <span className="truncate">{block.label}</span>
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
                    <span className="truncate">{block.label}</span>
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

          {/* Sugestão quando canvas vazio */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 pointer-events-auto">
                <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-700">Comece seu fluxo!</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Recomendamos começar com o bloco de <strong>Apresentação Inicial</strong> para uma melhor experiência
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold shadow-lg"
                  onClick={() => handleAddNode('initial_presentation')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Adicionar Apresentação Inicial
                </Button>
                <p className="text-xs text-gray-400">
                  ou escolha qualquer bloco da sidebar ←
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Direita - Controles */}
        <Card className="w-80 flex-shrink-0 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Controles</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {/* Entry Point */}
            <div>
              <Label>Passo Inicial</Label>
              <Select value={entryPointId} onValueChange={setEntryPointId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o primeiro passo" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estatísticas */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total de passos:</span>
                <Badge>{nodes.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Conexões:</span>
                <Badge>{edges.length}</Badge>
              </div>
            </div>

            {/* Validação */}
            <Button onClick={handleValidate} className="w-full" variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Validar Fluxo
            </Button>

            {/* Erros de Validação */}
            {validationErrors.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <Alert
                    key={index}
                    variant={error.severity === 'error' ? 'destructive' : 'default'}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{error.type}</AlertTitle>
                    <AlertDescription className="text-xs">
                      {error.message}
                      {error.suggestion && (
                        <div className="mt-1 text-muted-foreground">💡 {error.suggestion}</div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Export */}
            <Button onClick={handleExportJSON} className="w-full mt-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Editores específicos por tipo de bloco */}

      {/* 1. Apresentação Inicial */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 2. Fazer Pergunta */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 3. Enviar Mensagem */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 4. Solicitar Documento */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 5. Ensinar/Orientar */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 6. Validar Documento */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 7. Decisão (SE/ENTÃO) */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 8. Verificar Se Já Fez */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 9. Repetir com Variação */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 10. Atualizar Dados do Lead */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 11. Mover Lead no Funil */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 12. Aguardar Ação */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 13. Encaminhar para Humano */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 14. Finalizar Conversa */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 15. Enviar Link */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}

      {/* 16. Enviar Mídia */}
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
          onSave={(data) => {
            handleSaveNode(data);
          }}
        />
      )}
    </div>
  );
}
