import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Zap, GitBranch, StopCircle, Edit3 } from 'lucide-react';
import { NodeEditDialog } from '../NodeEditDialog';
import { Button } from '../ui/button';

const iconMap = {
  start: Play,
  action: Zap,
  decision: GitBranch,
  end: StopCircle,
};

const colorMap = {
  start: 'border-emerald-500 text-emerald-500',
  action: 'border-purple-500 text-purple-500',
  decision: 'border-amber-500 text-amber-500',
  end: 'border-red-500 text-red-500',
};

const bgMap = {
  start: 'from-emerald-500/20 to-emerald-500/5',
  action: 'from-purple-500/20 to-purple-500/5',
  decision: 'from-amber-500/20 to-amber-500/5',
  end: 'from-red-500/20 to-red-500/5',
};

export const CustomNode = memo(({ data, id }: NodeProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const Icon = iconMap[data.type as keyof typeof iconMap] || Zap;
  const colorClass = colorMap[data.type as keyof typeof colorMap] || colorMap.action;
  const bgClass = bgMap[data.type as keyof typeof bgMap] || bgMap.action;
  const isGlass = data.designStyle === 'glass';

  return (
    <>
      <div
        className={`
          relative min-w-[220px] rounded-2xl border-2 ${colorClass}
          ${isGlass ? 'glass' : 'neu'}
          transition-smooth hover:scale-105 group
        `}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgClass} rounded-2xl opacity-50`} />
        
        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={`
              p-2 rounded-xl
              ${isGlass ? 'glass-dark' : 'neu-inset'}
              group-hover:animate-float
            `}>
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
            className={`
              w-full mt-2
              ${isGlass ? 'glass-dark hover:bg-white/20' : 'neu-hover'}
              transition-smooth text-xs
            `}
          >
            <Edit3 className="w-3 h-3 mr-2" />
            Editar
          </Button>
        </div>

        {/* Handles - Horizontal */}
        {data.type !== 'start' && (
          <Handle
            type="target"
            position={Position.Left}
            className={`
              !w-3 !h-3 !rounded-full !border-2
              ${colorClass}
              ${isGlass ? '!bg-white/50' : '!bg-background'}
              transition-smooth hover:!scale-150
            `}
          />
        )}
        {data.type !== 'end' && (
          <Handle
            type="source"
            position={Position.Right}
            className={`
              !w-3 !h-3 !rounded-full !border-2
              ${colorClass}
              ${isGlass ? '!bg-white/50' : '!bg-background'}
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
