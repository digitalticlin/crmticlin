
import { Contact } from '@/types/chat';
import { useLeadStageManager } from '@/hooks/chat/useLeadStageManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageDropdownMenuProps {
  contact: Contact;
  currentStageId?: string | null;
}

export const StageDropdownMenu = ({ contact, currentStageId }: StageDropdownMenuProps) => {
  const {
    stagesByFunnel,
    currentStage,
    isLoading,
    isChanging,
    isOpen,
    setIsOpen,
    changeStage
  } = useLeadStageManager(contact.id, currentStageId);

  const handleStageChange = (stageId: string, stageName: string) => {
    if (stageId === currentStageId) return;
    changeStage({ stageId, stageName });
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-6 w-6 p-0">
        <Loader2 className="h-3 w-3 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 hover:bg-white/20 transition-colors"
          disabled={isChanging}
        >
          {isChanging ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowUpDown className="h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {currentStage && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: currentStage.color }}
              />
              Etapa Atual: {currentStage.title}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        
        {Object.entries(stagesByFunnel).map(([funnelName, stages]) => (
          <div key={funnelName}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              📋 {funnelName}
            </DropdownMenuLabel>
            
            {stages.map((stage) => {
              const isCurrentStage = stage.id === currentStageId;
              const isWonLost = stage.is_won || stage.is_lost;
              
              return (
                <DropdownMenuItem
                  key={stage.id}
                  onClick={() => !isWonLost && handleStageChange(stage.id, stage.title)}
                  disabled={isWonLost || isChanging}
                  className={cn(
                    "flex items-center justify-between gap-2 cursor-pointer",
                    isCurrentStage && "bg-accent/50",
                    isWonLost && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="truncate">{stage.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isCurrentStage && <Check className="h-3 w-3 text-green-600" />}
                    {isWonLost && (
                      <span className="text-xs text-muted-foreground">
                        {stage.is_won ? '🏆' : '❌'}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
            
            <DropdownMenuSeparator />
          </div>
        ))}
        
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          💡 Use o funil para GANHO/PERDIDO
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
