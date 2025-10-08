import { useCallback, useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { convertReactFlowToStructured, convertStructuredToReactFlow } from "@/utils/flowConverter";
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
import { ArrowLeft, MessageSquare, FileText, Send, GitBranch, CheckCircle, Phone, GraduationCap, Search, RotateCcw, UserCog, Target, Play, Link as LinkIcon, Image, MousePointer2, Hand, MessageCircleQuestion, Crown, RefreshCw, Calendar, CalendarClock, Images, Globe, Package, Wand2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CustomNode } from '@/components/flow-builder/CustomNode';
import { MobileBlockDrawer } from '@/components/flow-builder/MobileBlockDrawer';
import { useIsMobile } from '@/hooks/use-mobile';

const nodeTypes = {
  custom: CustomNode,
};

// Blocos organizados por categoria (15 tipos da flow-builder-test)
const BLOCK_TYPES = [
  // COMUNICAÇÃO
  { type: 'ask_question', icon: <MessageCircleQuestion className="h-4 w-4" />, label: 'Fazer Pergunta', color: 'bg-blue-500', category: 'Comunicação' },
  { type: 'send_message', icon: <MessageSquare className="h-4 w-4" />, label: 'Enviar Mensagem', color: 'bg-purple-500', category: 'Comunicação' },
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
  { type: 'end_conversation', icon: <CheckCircle className="h-4 w-4" />, label: 'Finalizar Conversa', color: 'bg-green-500', category: 'Controle' },
];

// Blocos Premium (bloqueados)
const PREMIUM_BLOCKS = [
  { type: 'transfer_to_human', icon: <FaWhatsapp className="h-4 w-4" />, label: 'Transferir para Humano', color: 'bg-green-600', category: 'Premium', isPremium: true },
  { type: 'follow_up', icon: <RefreshCw className="h-4 w-4" />, label: 'Follow Up', color: 'bg-violet-500', category: 'Premium', isPremium: true },
  { type: 'schedule_meeting', icon: <Calendar className="h-4 w-4" />, label: 'Marcar Reunião', color: 'bg-rose-500', category: 'Premium', isPremium: true },
  { type: 'schedule_time', icon: <CalendarClock className="h-4 w-4" />, label: 'Agendar Horário', color: 'bg-sky-500', category: 'Premium', isPremium: true },
  { type: 'send_multiple_media', icon: <Images className="h-4 w-4" />, label: 'Envio de Várias Mídias', color: 'bg-fuchsia-500', category: 'Premium', isPremium: true },
  { type: 'integrate_website', icon: <Globe className="h-4 w-4" />, label: 'Integrar com Site', color: 'bg-lime-500', category: 'Premium', isPremium: true },
  { type: 'integrate_stock', icon: <Package className="h-4 w-4" />, label: 'Integrar com Estoque', color: 'bg-slate-500', category: 'Premium', isPremium: true },
  { type: 'custom_function', icon: <Wand2 className="h-4 w-4" />, label: 'Personalizar Função', color: 'bg-gradient-to-r from-purple-500 to-pink-500', category: 'Premium', isPremium: true },
];

// Bloco especial de início
const SPECIAL_BLOCK = {
  type: 'start',
  icon: <Play className="h-4 w-4" />,
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
      description: 'Se apresentar e entender a mensagem do cliente para seguir o fluxo correto',
      designStyle: 'glass',
    },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [];

function FlowBuilderContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { agentId } = useParams<{ agentId: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Proteção: redirecionar se agentId for "new"
  useEffect(() => {
    if (agentId === 'new') {
      toast.error('Crie o agente primeiro antes de configurar o fluxo');
      navigate('/ai-agents/create');
    }
  }, [agentId, navigate]);

  // Carregar flow ao montar
  useEffect(() => {
    const loadFlow = async () => {
      if (!agentId || agentId === 'new') {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('flow')
          .eq('id', agentId)
          .single();

        if (error) throw error;

        if (data?.flow) {
          const structuredFlow = data.flow;
          console.log('📦 Fluxo carregado do banco:', structuredFlow);

          const { nodes: loadedNodes, edges: loadedEdges } = convertStructuredToReactFlow(structuredFlow);
          console.log('🔄 Nodes após conversão:', loadedNodes);

          if (loadedNodes.length > 0) {
            setNodes(loadedNodes);
            setEdges(loadedEdges);

            // Atualizar nodeIdCounter para o maior ID existente + 1
            const maxId = Math.max(...loadedNodes.map(n => parseInt(n.id) || 0));
            setNodeIdCounter(maxId + 1);
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar flow:', error);
        toast.error('Erro ao carregar fluxo');
      } finally {
        setIsLoading(false);
      }
    };

    loadFlow();
  }, [agentId]);

  const handleSave = async () => {
    if (!agentId || agentId === 'new') {
      toast.error('Salve o agente primeiro antes de criar o fluxo');
      return;
    }

    setIsSaving(true);
    setIsSaved(false);

    try {
      // Validar se tem nodes
      if (nodes.length === 0) {
        toast.error('Adicione pelo menos um bloco antes de salvar');
        setIsSaving(false);
        return;
      }

      // Converter para estrutura padronizada
      const structuredFlow = convertReactFlowToStructured(nodes, edges);

      // Salvar no banco
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          flow: structuredFlow,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .select('id, name, flow');

      if (error) throw error;

      toast.success('Fluxo salvo com sucesso!');
      setIsSaved(true);

      // Resetar estado "SALVO!" após 2 segundos
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao salvar fluxo:', error);
      toast.error(error.message || 'Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="w-full h-full flex gap-0 md:gap-4 p-0 md:p-4 overflow-hidden bg-gradient-canvas">
      {/* Canvas Principal com Glassmorphism - Ocupa espaço disponível */}
      <div className="flex-1 h-full overflow-hidden relative glass border-0 md:border-2 border-white/30 md:rounded-2xl shadow-lg">
        {/* Header Minimalista */}
        <div className="absolute top-2 md:top-4 left-2 md:left-4 z-50 flex items-center gap-1.5 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/ai-agents/edit/${agentId}?step=3`)}
            className="h-8 w-8 md:h-9 md:w-9 rounded-lg glass hover:bg-white/40 transition-all shadow-lg border border-white/30"
          >
            <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-700" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm rounded-lg glass border transition-all shadow-lg font-medium ${
              isSaved
                ? 'bg-green-500/20 border-green-500/50 text-green-700'
                : 'border-white/30 hover:bg-white/40 text-gray-700'
            }`}
          >
            {isSaving ? 'Salvando...' : isSaved ? '✓ Salvo!' : 'Salvar'}
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
        <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 z-10 hidden md:block">
          <div className="glass border border-white/30 rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm font-semibold text-gray-700">Fluxo de Atendimento da IA</p>
          </div>
        </div>
      </div>

      {/* Mobile: Drawer flutuante */}
      {isMobile && (
        <MobileBlockDrawer
          onAddNode={addNode}
          blockTypes={BLOCK_TYPES}
          premiumBlocks={PREMIUM_BLOCKS}
          specialBlock={SPECIAL_BLOCK}
        />
      )}

      {/* Desktop: Sidebar Direita - Blocos Modernizado */}
      {!isMobile && (
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

            {/* Premium */}
            <div className="pt-2 border-t border-white/30">
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <Crown className="w-3 h-3 text-amber-500" />
                <h3 className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Premium</h3>
              </div>
              <div className="space-y-1">
                {PREMIUM_BLOCKS.map((block) => (
                  <Button
                    key={block.type}
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full justify-start gap-1.5 text-[10.5px] h-8 px-2 glass border-white/40 opacity-60 cursor-not-allowed relative group"
                    onClick={() => {
                      alert('🔒 Recurso Premium\n\nEste bloco está disponível apenas no plano Premium.\n\nEntre em contato com nossa equipe comercial para liberar este e outros recursos exclusivos!');
                    }}
                  >
                    <div className={`p-1 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>
                      {block.icon}
                    </div>
                    <span className="truncate font-medium">{block.label}</span>
                    <Crown className="w-3 h-3 text-amber-500 ml-auto" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
