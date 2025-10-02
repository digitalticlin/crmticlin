import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
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
  Sparkles,
  Link as LinkIcon,
  Image,
  Edit3
} from 'lucide-react';
import { NodeEditDialog } from './NodeEditDialog';
import { Button } from '../ui/button';

const iconMap = {
  // Special
  initial_presentation: Sparkles,
  start: Sparkles,

  // Comunicação
  ask_question: MessageSquare,
  send_message: Send,
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
  wait_for_action: Clock,
  transfer_to_human: Phone,
  end_conversation: CheckCircle,
};

const colorMap = {
  // Special
  initial_presentation: 'border-orange-500 text-orange-600',
  start: 'border-orange-500 text-orange-600',

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
  wait_for_action: 'border-gray-500 text-gray-600',
  transfer_to_human: 'border-orange-600 text-orange-700',
  end_conversation: 'border-green-500 text-green-600',
};

const bgMap = {
  // Special
  initial_presentation: 'from-orange-500/20 to-yellow-400/5',
  start: 'from-orange-500/20 to-yellow-400/5',

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
  wait_for_action: 'from-gray-500/20 to-gray-500/5',
  transfer_to_human: 'from-orange-600/20 to-orange-600/5',
  end_conversation: 'from-green-500/20 to-green-500/5',
};

export const CustomNode = memo(({ data, id }: NodeProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const Icon = iconMap[data.type as keyof typeof iconMap] || Sparkles;
  const colorClass = colorMap[data.type as keyof typeof colorMap] || colorMap.send_message;
  const bgClass = bgMap[data.type as keyof typeof bgMap] || bgMap.send_message;

  return (
    <>
      <div
        className={`
          relative min-w-[220px] rounded-2xl border-2 ${colorClass}
          glass
          transition-smooth hover:scale-105 group
        `}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgClass} rounded-2xl opacity-50`} />

        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-xl glass-dark group-hover:animate-float">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1">{data.label}</div>
              <div className="text-xs text-muted-foreground capitalize mb-1">{data.type}</div>
              {data.description && (
                <div className="text-xs text-muted-foreground/80 line-clamp-2 mt-2">
                  {data.description}
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="w-full mt-2 glass-dark hover:bg-white/20 transition-smooth text-xs"
          >
            <Edit3 className="w-3 h-3 mr-2" />
            Editar
          </Button>
        </div>

        {/* Handles - Horizontal */}
        {data.type !== 'start' && data.type !== 'initial_presentation' && (
          <Handle
            type="target"
            position={Position.Left}
            className={`
              !w-3 !h-3 !rounded-full !border-2
              ${colorClass}
              !bg-white/50
              transition-smooth hover:!scale-150
            `}
          />
        )}
        {data.type !== 'end_conversation' && (
          <Handle
            type="source"
            position={Position.Right}
            className={`
              !w-3 !h-3 !rounded-full !border-2
              ${colorClass}
              !bg-white/50
              transition-smooth hover:!scale-150
            `}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <NodeEditDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        nodeId={id}
        currentLabel={data.label}
        currentDescription={data.description || ''}
        designStyle={data.designStyle}
      />
    </>
  );
});

CustomNode.displayName = 'CustomNode';
