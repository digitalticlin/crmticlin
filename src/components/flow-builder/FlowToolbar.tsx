import { Play, Zap, GitBranch, StopCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface FlowToolbarProps {
  onAddNode: (type: 'start' | 'action' | 'decision' | 'end') => void;
  designStyle: 'glass' | 'neu';
}

export const FlowToolbar = ({ onAddNode, designStyle }: FlowToolbarProps) => {
  const baseClass = designStyle === 'glass' ? 'glass' : 'neu';

  const nodes = [
    { type: 'start' as const, icon: Play, label: 'Início', color: 'text-emerald-500' },
    { type: 'action' as const, icon: Zap, label: 'Ação', color: 'text-purple-500' },
    { type: 'decision' as const, icon: GitBranch, label: 'Decisão', color: 'text-amber-500' },
    { type: 'end' as const, icon: StopCircle, label: 'Fim', color: 'text-red-500' },
  ];

  return (
    <div className="px-6 pb-4">
      <div className={`${baseClass} rounded-2xl p-4 transition-smooth`}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Adicionar Bloco:</span>
          <div className="flex gap-2">
            {nodes.map(({ type, icon: Icon, label, color }) => (
              <Button
                key={type}
                onClick={() => onAddNode(type)}
                variant="ghost"
                size="sm"
                className={`
                  ${designStyle === 'glass' ? 'glass-dark hover:bg-white/20' : 'neu-hover'}
                  transition-smooth group
                `}
              >
                <Icon className={`w-4 h-4 mr-2 ${color} group-hover:scale-110 transition-transform`} />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
