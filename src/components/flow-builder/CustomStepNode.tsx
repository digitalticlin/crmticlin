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
        relative px-4 py-3 rounded-2xl border-2 min-w-[220px] max-w-[320px]
        flow-glass-gray neon-hover-glow
        transition-all duration-300
        ${selected ? 'neon-border-glow shadow-2xl scale-105' : 'border-white/10'}
        ${hasErrors ? 'border-red-400 animate-pulse' : ''}
        group
      `}
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-flow-gradient-node rounded-2xl opacity-40 -z-10" />

      {/* Handle de entrada (esquerda) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'linear-gradient(135deg, rgb(149, 193, 31) 0%, rgb(222, 220, 0) 100%)'
        }}
        className="!w-4 !h-4 !border-2 !border-white !shadow-lg"
      />

      {/* Cabeçalho com ícone */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          p-2 rounded-xl ${getStepColor(data.stepType)} text-white shadow-md flow-glass-dark border border-white/10
          group-hover:animate-flow-float transition-all duration-300
        `}>
          {getStepIcon(data.stepType)}
        </div>
        <div className="flex-1 font-bold text-sm text-gray-100 truncate">
          {data.label || 'Novo passo'}
        </div>
      </div>

      {/* Preview da mensagem */}
      {data.messages && data.messages.length > 0 && (
        <div className="text-xs text-gray-200 mb-3 line-clamp-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
          {data.messages[0].type === 'text'
            ? data.messages[0].content.substring(0, 60) + (data.messages[0].content.length > 60 ? '...' : '')
            : 'Mensagem condicional'}
        </div>
      )}

      {/* Badges de status */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {data.decisions.length > 0 && (
          <Badge variant="outline" className="text-xs backdrop-blur-sm bg-white/20 border-white/10 text-gray-200">
            {data.decisions.length} saída{data.decisions.length > 1 ? 's' : ''}
          </Badge>
        )}
        {isTerminal && (
          <Badge variant="outline" className="text-xs backdrop-blur-sm bg-pulse-600/20 text-pulse-600 border-pulse-600/50">
            ✓ Final
          </Badge>
        )}
        {hasErrors && (
          <Badge variant="outline" className="text-xs backdrop-blur-sm bg-red-500/20 text-red-400 border-red-500/50">
            ⚠ Erro
          </Badge>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit();
          }}
          className="h-8 px-3 flex-1 flow-glass-dark hover:bg-white/10 transition-all duration-200 text-gray-200 border border-white/10"
        >
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete();
          }}
          className="h-8 px-3 flow-glass-dark hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 text-gray-200 border border-red-500/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Handle de saída (direita) - só se não for terminal */}
      {!isTerminal && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: 'linear-gradient(135deg, rgb(149, 193, 31) 0%, rgb(222, 220, 0) 100%)'
          }}
          className="!w-4 !h-4 !border-2 !border-white !shadow-lg"
        />
      )}
    </div>
  );
});

CustomStepNode.displayName = 'CustomStepNode';
