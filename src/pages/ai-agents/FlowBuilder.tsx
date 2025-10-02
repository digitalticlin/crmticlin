import { useCallback, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, FileText, Send, GitBranch, CheckCircle, Clock, Phone, GraduationCap, Search, RotateCcw, UserCog, Target, Sparkles, Link as LinkIcon, Image, MousePointer2, Hand } from "lucide-react";
import { CustomNode } from '@/components/flow-builder/CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

// Blocos organizados por categoria (15 tipos da flow-builder-test)
const BLOCK_TYPES = [
  // COMUNICAÇÃO
  { type: 'ask_question', icon: <MessageSquare className="h-4 w-4" />, label: 'Fazer Pergunta', color: 'bg-blue-500', category: 'Comunicação' },
  { type: 'send_message', icon: <Send className="h-4 w-4" />, label: 'Enviar Mensagem', color: 'bg-purple-500', category: 'Comunicação' },
  { type: 'request_document', icon: <FileText className="h-4 w-4" />, label: 'Solicitar Documento', color: 'bg-orange-500', category: 'Comunicação' },
  { type: 'send_link', icon: <LinkIcon className="h-4 w-4" />, label: 'Enviar Link', color: 'bg-cyan-500', category: 'Comunicação' },
  { type: 'send_media', icon: <Image className="h-4 w-4" />, label: 'Enviar Mídia', color: 'bg-pink-500', category: 'Comunicação' },
  { type: 'provide_instructions', icon: <GraduationCap className="h-4 w-4" />, label: 'Ensinar/Orientar', color: 'bg-indigo-500', category: 'Comunicação' },

  // LÓGICA
  { type: 'branch_decision', icon: <GitBranch className="h-4 w-4" />, label: 'Decisão', color: 'bg-yellow-500', category: 'Lógica' },
  { type: 'validate_document', icon: <Search className="h-4 w-4" />, label: 'Validar Documento', color: 'bg-red-500', category: 'Lógica' },
  { type: 'check_if_done', icon: <Search className="h-4 w-4" />, label: 'Verificar Se Já Fez', color: 'bg-teal-500', category: 'Lógica' },
  { type: 'retry_with_variation', icon: <RotateCcw className="h-4 w-4" />, label: 'Repetir com Variação', color: 'bg-pink-500', category: 'Lógica' },

  // CRM
  { type: 'update_lead_data', icon: <UserCog className="h-4 w-4" />, label: 'Atualizar Dados do Lead', color: 'bg-cyan-500', category: 'CRM' },
  { type: 'move_lead_in_funnel', icon: <Target className="h-4 w-4" />, label: 'Mover Lead no Funil', color: 'bg-emerald-600', category: 'CRM' },

  // CONTROLE
  { type: 'wait_for_action', icon: <Clock className="h-4 w-4" />, label: 'Aguardar Ação', color: 'bg-gray-500', category: 'Controle' },
  { type: 'transfer_to_human', icon: <Phone className="h-4 w-4" />, label: 'Encaminhar para Humano', color: 'bg-orange-600', category: 'Controle' },
  { type: 'end_conversation', icon: <CheckCircle className="h-4 w-4" />, label: 'Finalizar Conversa', color: 'bg-green-500', category: 'Controle' },
];

// Bloco especial de início
const SPECIAL_BLOCK = {
  type: 'start',
  icon: <Sparkles className="h-4 w-4" />,
  label: 'Início',
  color: 'bg-green-500',
  category: 'Especial',
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    data: {
      label: 'Início',
      type: 'start',
      description: 'Ponto inicial do fluxo do agente',
      designStyle: 'glass',
    },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [];

function FlowBuilderContent() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: string) => {
      const blockInfo = [...BLOCK_TYPES, SPECIAL_BLOCK].find(b => b.type === type);
      const newNode: Node = {
        id: `${nodeIdCounter}`,
        type: 'custom',
        data: {
          label: blockInfo?.label || 'Novo Bloco',
          type: type as any,
          designStyle: 'glass',
        },
        position: {
          x: Math.random() * 400 + 200,
          y: Math.random() * 300 + 150,
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter((id) => id + 1);
    },
    [nodeIdCounter, setNodes]
  );

  return (
    <div className="w-full h-full flex gap-4 p-4 overflow-hidden bg-gradient-canvas">
      {/* Canvas Principal com Glassmorphism - Ocupa espaço disponível */}
      <div className="flex-1 h-full overflow-hidden relative glass border-2 border-white/30 rounded-2xl shadow-lg">
        {/* Header Minimalista no Canto Esquerdo */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-lg glass hover:bg-white/40 transition-all shadow-lg border border-white/30"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-9 px-4 rounded-lg glass border border-white/30 hover:bg-white/40 transition-all shadow-lg font-medium text-gray-700"
          >
            Salvar
          </Button>
        </div>

        {/* ReactFlow Canvas com fundo visível */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          minZoom={0.3}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          className="w-full h-full"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} color="#E9D5FF" />
          <Controls className="glass !border-white/30 !shadow-lg" showInteractive={false} />
        </ReactFlow>

        {/* Título do Fluxo - Posicionado no canto inferior direito */}
        <div className="absolute bottom-4 right-4 z-10">
          <div className="glass border border-white/30 rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm font-semibold text-gray-700">Fluxo de Atendimento da IA</p>
          </div>
        </div>
      </div>

      {/* Sidebar Direita - Blocos Modernizado */}
      <div className="w-[200px] flex-shrink-0 h-full overflow-y-auto overflow-x-hidden glass border-2 border-white/30 rounded-2xl shadow-lg kanban-horizontal-scroll">
          {/* Header Moderno com Ícones */}
          <div className="px-3 py-4 border-b border-white/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MousePointer2 className="h-4 w-4 text-purple-500" />
              <Hand className="h-4 w-4 text-purple-500" />
            </div>
            <h2 className="text-sm font-semibold text-center text-gray-800">
              Clique ou Arraste
            </h2>
            <p className="text-[9px] text-center text-gray-500 mt-1">Escolha a etapa do fluxo</p>
          </div>

          {/* Conteúdo dos Blocos */}
          <div className="space-y-3 p-2.5">
            {/* Início */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Início</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-1.5 text-[10.5px] h-8 px-2 glass hover:bg-white/40 border-white/40 transition-all hover:scale-[1.02]"
                onClick={() => addNode(SPECIAL_BLOCK.type)}
              >
                <div className={`p-1 rounded-md ${SPECIAL_BLOCK.color} text-white flex-shrink-0 shadow-sm`}>
                  {SPECIAL_BLOCK.icon}
                </div>
                <span className="truncate font-medium">{SPECIAL_BLOCK.label}</span>
              </Button>
            </div>

            {/* Comunicação */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Comunicação</h3>
              </div>
              <div className="space-y-1">
                {BLOCK_TYPES.filter(b => b.category === 'Comunicação').map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-[10.5px] h-8 px-2 glass hover:bg-white/40 border-white/40 transition-all hover:scale-[1.02]"
                    onClick={() => addNode(block.type)}
                  >
                    <div className={`p-1 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>{block.icon}</div>
                    <span className="truncate font-medium">{block.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Lógica */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Lógica</h3>
              </div>
              <div className="space-y-1">
                {BLOCK_TYPES.filter(b => b.category === 'Lógica').map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-[10.5px] h-8 px-2 glass hover:bg-white/40 border-white/40 transition-all hover:scale-[1.02]"
                    onClick={() => addNode(block.type)}
                  >
                    <div className={`p-1 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>{block.icon}</div>
                    <span className="truncate font-medium">{block.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* CRM */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">CRM</h3>
              </div>
              <div className="space-y-1">
                {BLOCK_TYPES.filter(b => b.category === 'CRM').map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-[10.5px] h-8 px-2 glass hover:bg-white/40 border-white/40 transition-all hover:scale-[1.02]"
                    onClick={() => addNode(block.type)}
                  >
                    <div className={`p-1 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>{block.icon}</div>
                    <span className="truncate font-medium">{block.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Controle */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Controle</h3>
              </div>
              <div className="space-y-1">
                {BLOCK_TYPES.filter(b => b.category === 'Controle').map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-1.5 text-[10.5px] h-8 px-2 glass hover:bg-white/40 border-white/40 transition-all hover:scale-[1.02]"
                    onClick={() => addNode(block.type)}
                  >
                    <div className={`p-1 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>{block.icon}</div>
                    <span className="truncate font-medium">{block.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}
