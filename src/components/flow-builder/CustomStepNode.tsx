import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CustomNodeData } from '@/types/flowBuilder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  FileText,
  Clock,
  Send,
  GitBranch,
  CheckCircle,
  Edit,
  Trash2,
  GraduationCap,
  Search,
  RotateCcw,
  UserCog,
  Target,
  Phone,
  Sparkles
} from 'lucide-react';

const getStepIcon = (stepType: string) => {
  switch (stepType) {
    // Especial
    case 'initial_presentation': return <Sparkles className="h-4 w-4" />;
    // Comunicação
    case 'ask_question': return <MessageSquare className="h-4 w-4" />;
    case 'request_document': return <FileText className="h-4 w-4" />;
    case 'send_message': return <Send className="h-4 w-4" />;
    case 'provide_instructions': return <GraduationCap className="h-4 w-4" />;
    // Lógica
    case 'validate_document': return <Search className="h-4 w-4" />;
    case 'branch_decision': return <GitBranch className="h-4 w-4" />;
    case 'check_if_done': return <Search className="h-4 w-4" />;
    case 'retry_with_variation': return <RotateCcw className="h-4 w-4" />;
    // CRM
    case 'update_lead_data': return <UserCog className="h-4 w-4" />;
    case 'move_lead_in_funnel': return <Target className="h-4 w-4" />;
    // Controle
    case 'wait_for_action': return <Clock className="h-4 w-4" />;
    case 'transfer_to_human': return <Phone className="h-4 w-4" />;
    case 'end_conversation': return <CheckCircle className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
};

const getStepColor = (stepType: string) => {
  switch (stepType) {
    // Especial
    case 'initial_presentation': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    // Comunicação
    case 'ask_question': return 'bg-blue-500';
    case 'request_document': return 'bg-orange-500';
    case 'send_message': return 'bg-purple-500';
    case 'provide_instructions': return 'bg-indigo-500';
    // Lógica
    case 'validate_document': return 'bg-red-500';
    case 'branch_decision': return 'bg-yellow-500';
    case 'check_if_done': return 'bg-teal-500';
    case 'retry_with_variation': return 'bg-pink-500';
    // CRM
    case 'update_lead_data': return 'bg-cyan-500';
    case 'move_lead_in_funnel': return 'bg-emerald-600';
    // Controle
    case 'wait_for_action': return 'bg-gray-500';
    case 'transfer_to_human': return 'bg-orange-600';
    case 'end_conversation': return 'bg-green-500';
    default: return 'bg-blue-500';
  }
};

export const CustomStepNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const hasErrors = data.hasErrors || false;
  const isTerminal = data.isTerminal || false;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-lg border-2 bg-white shadow-lg min-w-[200px] max-w-[300px]
        transition-all duration-200
        ${selected ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-300'}
        ${hasErrors ? 'border-red-500 animate-pulse' : ''}
      `}
    >
      {/* Handle de entrada (esquerda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Cabeçalho com ícone */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${getStepColor(data.stepType)} text-white`}>
          {getStepIcon(data.stepType)}
        </div>
        <div className="flex-1 font-semibold text-sm text-gray-900 truncate">
          {data.label || 'Novo passo'}
        </div>
      </div>

      {/* Preview da mensagem */}
      {data.messages && data.messages.length > 0 && (
        <div className="text-xs text-gray-600 mb-2 line-clamp-2">
          {data.messages[0].type === 'text'
            ? data.messages[0].content.substring(0, 60) + (data.messages[0].content.length > 60 ? '...' : '')
            : 'Mensagem condicional'}
        </div>
      )}

      {/* Badges de status */}
      <div className="flex flex-wrap gap-1 mb-2">
        {data.decisions.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {data.decisions.length} saída{data.decisions.length > 1 ? 's' : ''}
          </Badge>
        )}
        {isTerminal && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
            ✓ Final
          </Badge>
        )}
        {hasErrors && (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
            ⚠ Erro
          </Badge>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
          }}
          className="h-7 px-2 flex-1"
        >
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete();
          }}
          className="h-7 px-2 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Handle de saída (direita) - só se não for terminal */}
      {!isTerminal && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
        />
      )}
    </div>
  );
});

CustomStepNode.displayName = 'CustomStepNode';
