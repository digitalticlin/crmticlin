import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useReactFlow } from 'reactflow';
import {
  MessageSquare,
  FileText,
  Send,
  GitBranch,
  CheckCircle,
  Clock,
  Phone,
  GraduationCap,
  Search,
  RotateCcw,
  UserCog,
  Target,
  Play,
  Link as LinkIcon,
  Image,
  Edit3,
  Trash2,
  CircleCheck,
  CircleAlert,
  HelpCircle,
  MessageCircleQuestion
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { PresentationEditor } from './editors/PresentationEditor';
import { AskQuestionEditor } from './editors/AskQuestionEditor';
import { SendMessageEditor } from './editors/SendMessageEditor';
import { RequestDocumentEditor } from './editors/RequestDocumentEditor';
import { SendLinkEditor } from './editors/SendLinkEditor';
import { SendMediaEditor } from './editors/SendMediaEditor';
import { TeachEditor } from './editors/TeachEditor';
import { ValidateDocumentEditor } from './editors/ValidateDocumentEditor';
import { DecisionEditor } from './editors/DecisionEditor';
import { CheckIfDoneEditor } from './editors/CheckIfDoneEditor';
import { RetryVariationEditor } from './editors/RetryVariationEditor';
import { UpdateLeadEditor } from './editors/UpdateLeadEditor';
import { MoveFunnelEditor } from './editors/MoveFunnelEditor';
import { TransferHumanEditor } from './editors/TransferHumanEditor';
import { EndConversationEditor } from './editors/EndConversationEditor';
import { Button } from '../ui/button';

const iconMap = {
  // Special
  start: Play,

  // Comunicação
  ask_question: MessageCircleQuestion,
  send_message: MessageSquare,
  request_document: FileText,
  send_link: LinkIcon,
  send_media: Image,
  provide_instructions: GraduationCap,

  // Lógica
  branch_decision: GitBranch,
  validate_document: Search,
  check_if_done: Search,
  retry_with_variation: RotateCcw,

  // CRM
  update_lead_data: UserCog,
  move_lead_in_funnel: Target,

  // Controle
  transfer_to_human: FaWhatsapp,
  end_conversation: CheckCircle,
};

const colorMap = {
  // Special
  start: 'border-green-500 text-green-600',

  // Comunicação
  ask_question: 'border-blue-500 text-blue-600',
  send_message: 'border-purple-500 text-purple-600',
  request_document: 'border-orange-500 text-orange-600',
  send_link: 'border-cyan-500 text-cyan-600',
  send_media: 'border-pink-500 text-pink-600',
  provide_instructions: 'border-indigo-500 text-indigo-600',

  // Lógica
  branch_decision: 'border-yellow-500 text-yellow-600',
  validate_document: 'border-red-500 text-red-600',
  check_if_done: 'border-teal-500 text-teal-600',
  retry_with_variation: 'border-pink-500 text-pink-600',

  // CRM
  update_lead_data: 'border-cyan-500 text-cyan-600',
  move_lead_in_funnel: 'border-emerald-600 text-emerald-700',

  // Controle
  transfer_to_human: 'border-green-600 text-green-600',
  end_conversation: 'border-green-500 text-green-600',
};

const bgMap = {
  // Special
  start: 'from-green-500/20 to-green-500/5',

  // Comunicação
  ask_question: 'from-blue-500/20 to-blue-500/5',
  send_message: 'from-purple-500/20 to-purple-500/5',
  request_document: 'from-orange-500/20 to-orange-500/5',
  send_link: 'from-cyan-500/20 to-cyan-500/5',
  send_media: 'from-pink-500/20 to-pink-500/5',
  provide_instructions: 'from-indigo-500/20 to-indigo-500/5',

  // Lógica
  branch_decision: 'from-yellow-500/20 to-yellow-500/5',
  validate_document: 'from-red-500/20 to-red-500/5',
  check_if_done: 'from-teal-500/20 to-teal-500/5',
  retry_with_variation: 'from-pink-500/20 to-pink-500/5',

  // CRM
  update_lead_data: 'from-cyan-500/20 to-cyan-500/5',
  move_lead_in_funnel: 'from-emerald-600/20 to-emerald-600/5',

  // Controle
  transfer_to_human: 'from-green-600/20 to-green-600/5',
  end_conversation: 'from-green-500/20 to-green-500/5',
};

export const CustomNode = memo(({ data, id }: NodeProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { deleteElements, setNodes, getEdges, getNodes } = useReactFlow();
  const Icon = iconMap[data.type as keyof typeof iconMap] || Play;
  const colorClass = colorMap[data.type as keyof typeof colorMap] || colorMap.send_message;
  const bgClass = bgMap[data.type as keyof typeof bgMap] || bgMap.send_message;

  // Verifica se o bloco está configurado (para bloco start)
  const isConfigured = data.type === 'start'
    ? !!(data.description && data.messages && data.messages.length > 0)
    : true;

  const handleSave = (savedData: any) => {
    console.log('Dados salvos:', savedData);

    // Atualizar o nó no ReactFlow com os novos dados
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                ...savedData,
                // Garantir que decisions seja salvo corretamente
                decisions: savedData.decisions || node.data.decisions || []
              }
            }
          : node
      )
    );
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  // Função para obter o bloco conectado ao input deste node
  const getConnectedInputBlock = () => {
    const edges = getEdges();
    const nodes = getNodes();

    // Encontrar a edge que conecta AO input deste node
    const inputEdge = edges.find(edge => edge.target === id);

    if (inputEdge) {
      // Encontrar o node de origem
      const sourceNode = nodes.find(node => node.id === inputEdge.source);
      if (sourceNode) {
        return {
          id: sourceNode.id,
          label: sourceNode.data.label || 'Bloco sem nome'
        };
      }
    }

    return null;
  };

  // Calcular altura mínima baseada no número de decisões
  const minHeight = data.decisions && data.decisions.length > 1
    ? 120 + (data.decisions.length - 1) * 40 // 40px de espaço por decisão adicional
    : 'auto';

  return (
    <>
      <div
        className={`
          relative min-w-[200px] md:min-w-[220px] rounded-2xl border-2 ${colorClass}
          glass
          transition-smooth hover:scale-105 active:scale-95 group touch-manipulation
        `}
        style={{
          minHeight: minHeight
        }}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgClass} rounded-2xl opacity-50`} />

        {/* Content */}
        <div className="relative p-3 md:p-4 pb-10 md:pb-12">
          <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="p-1.5 md:p-2 rounded-xl glass-dark group-hover:animate-float">
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-semibold text-xs md:text-sm">{data.label}</div>
                {data.type === 'start' && (
                  isConfigured ? (
                    <CircleCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" title="Configurado" />
                  ) : (
                    <CircleAlert className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" title="Não configurado" />
                  )
                )}
              </div>
              {data.description && (
                <div className="text-[10px] md:text-xs text-muted-foreground/80 line-clamp-2 mt-1 md:mt-2">
                  {data.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões Minimalistas - Footer Fixo - Touch friendly no mobile */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 pt-0">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditOpen(true)}
              className="flex-1 h-9 md:h-7 glass-dark hover:bg-white/20 active:bg-white/30 transition-smooth"
              title="Editar"
            >
              <Edit3 className="w-4 h-4 md:w-3 md:h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="flex-1 h-9 md:h-7 glass-dark hover:bg-red-500/20 active:bg-red-500/30 transition-smooth text-red-600"
              title="Excluir"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Handles - Input (Left) */}
        {data.type !== 'start' && (
          <Handle
            type="target"
            position={Position.Left}
            className={`
              !w-3 !h-3 !rounded-full !border-2
              ${colorClass}
              !bg-white/50
              !cursor-crosshair
            `}
          />
        )}

        {/* Handles - Output (Right) - Dinâmicos para blocos com decisões */}
        {data.type !== 'end_conversation' && (
          <>
            {data.decisions && data.decisions.length > 0 ? (
              // Múltiplos outputs numerados para blocos com decisões
              data.decisions.map((decision: any, index: number) => {
                const totalDecisions = data.decisions.length;
                // Espaçamento mínimo de 40px entre outputs
                const minSpacingPx = 40;
                const baseOffsetPx = 60; // Offset inicial do topo
                const topPosition = baseOffsetPx + (index * minSpacingPx);

                return (
                  <>
                    {/* Linha conectora DO BLOCO até o OUTPUT */}
                    <div
                      key={`connector-${index}`}
                      style={{
                        position: 'absolute',
                        right: '0px',
                        top: `${topPosition}px`,
                        width: '14px',
                        height: '2px',
                        pointerEvents: 'none',
                        zIndex: 0
                      }}
                      className={`${colorClass.split(' ')[1]} opacity-30`}
                    />
                    <Handle
                      key={`output-${index}`}
                      type="source"
                      position={Position.Right}
                      id={`output-${index}`}
                      style={{
                        position: 'absolute',
                        top: `${topPosition}px`,
                        right: '-14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px'
                      }}
                      className={`
                        !rounded-full !border-2
                        ${colorClass}
                        !bg-white
                        !cursor-crosshair
                      `}
                    >
                      <span className="text-xs font-bold pointer-events-none">
                        {index + 1}
                      </span>
                    </Handle>
                  </>
                );
              })
            ) : (
              // Output único padrão para blocos sem decisões
              <>
                {/* Linha conectora DO BLOCO até o OUTPUT */}
                <div
                  style={{
                    position: 'absolute',
                    right: '0px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '6px',
                    height: '2px',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                  className={`${colorClass.split(' ')[1]} opacity-30`}
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '12px',
                    height: '12px'
                  }}
                  className={`
                    !rounded-full !border-2
                    ${colorClass}
                    !bg-white/50
                    !cursor-crosshair
                  `}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Edit Dialog - Específico por tipo de bloco */}
      {data.type === 'start' && (
        <PresentationEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            decisions: data.decisions || [],
            description: data.description
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'ask_question' && (
        <AskQuestionEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            decisions: data.decisions || [],
            description: data.description
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'send_message' && (
        <SendMessageEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'request_document' && (
        <RequestDocumentEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            decisions: data.decisions || [],
            description: data.description,
            documentType: data.documentType,
            timeout: data.timeout,
            checkField: data.checkField,
            saveVariable: data.saveVariable
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'send_link' && (
        <SendLinkEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description,
            linkUrl: data.linkUrl,
            linkTitle: data.linkTitle
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'send_media' && (
        <SendMediaEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description,
            mediaType: data.mediaType,
            mediaUrl: data.mediaUrl,
            caption: data.caption
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'provide_instructions' && (
        <TeachEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description,
            teachingContent: data.teachingContent
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'validate_document' && (
        <ValidateDocumentEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            decisions: data.decisions || [],
            description: data.description,
            documentVariable: data.documentVariable,
            validationCriteria: data.validationCriteria
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'branch_decision' && (
        <DecisionEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            decisions: data.decisions || [],
            description: data.description
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'check_if_done' && (
        <CheckIfDoneEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          previousBlocks={getConnectedInputBlock() ? [getConnectedInputBlock()!] : []}
          initialData={{
            label: data.label,
            decisions: data.decisions || [],
            description: data.description,
            checkField: data.checkField,
            referenceBlockId: data.referenceBlockId
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'retry_with_variation' && (
        <RetryVariationEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          previousBlocks={getConnectedInputBlock() ? [getConnectedInputBlock()!] : []}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description,
            retryBlockId: data.retryBlockId
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'update_lead_data' && (
        <UpdateLeadEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            description: data.description,
            fieldUpdates: data.fieldUpdates
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'move_lead_in_funnel' && (
        <MoveFunnelEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            description: data.description,
            funnelId: data.funnelId,
            kanbanStageId: data.kanbanStageId,
            messages: data.messages
          }}
          onSave={handleSave}
        />
      )}


      {data.type === 'transfer_to_human' && (
        <TransferHumanEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description
          }}
          onSave={handleSave}
        />
      )}

      {data.type === 'end_conversation' && (
        <EndConversationEditor
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          initialData={{
            label: data.label,
            messages: data.messages || [],
            description: data.description,
            reason: data.reason,
            farewellMessage: data.farewellMessage
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
});

CustomNode.displayName = 'CustomNode';
