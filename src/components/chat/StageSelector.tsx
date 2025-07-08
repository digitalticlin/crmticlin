
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { useLeadStageManager } from "@/hooks/chat/useLeadStageManager";
import { cn } from "@/lib/utils";

interface StageSelectorProps {
  leadId: string;
  currentStageId: string | null;
  className?: string;
}

export const StageSelector = ({ leadId, currentStageId, className }: StageSelectorProps) => {
  const { 
    stagesByFunnel, 
    currentStage, 
    isLoading, 
    isChanging, 
    changeStage 
  } = useLeadStageManager(leadId, currentStageId);

  const [isOpen, setIsOpen] = useState(false);

  const handleStageChange = (stageId: string, stageName: string) => {
    changeStage({ stageId, stageName });
    setIsOpen(false);
  };

  const getCurrentStageDisplay = () => {
    if (isChanging) return "Alterando...";
    if (!currentStage) return "Sem etapa";
    return currentStage.title;
  };

  const getCurrentStageColor = () => {
    if (!currentStage) return "#6b7280";
    return currentStage.color;
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 px-3 py-1 text-sm font-medium transition-all duration-200",
            "hover:bg-white/20 rounded-full",
            "flex items-center gap-2",
            isChanging && "opacity-60 cursor-not-allowed",
            className
          )}
          disabled={isChanging}
        >
          <div 
            className="w-3 h-3 rounded-full border border-white/30"
            style={{ backgroundColor: getCurrentStageColor() }}
          />
          <span className="text-gray-700">
            {getCurrentStageDisplay()}
          </span>
          {isChanging ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="start" 
        className="w-64 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-xl border-white/20"
      >
        <DropdownMenuLabel className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Alterar Etapa
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(stagesByFunnel).map(([funnelName, stages]) => (
          <div key={funnelName}>
            <DropdownMenuLabel className="text-xs text-gray-500 px-2 py-1">
              {funnelName}
            </DropdownMenuLabel>
            
            {stages.map((stage) => (
              <DropdownMenuItem
                key={stage.id}
                onClick={() => handleStageChange(stage.id, stage.title)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer",
                  "hover:bg-white/50 transition-colors",
                  currentStage?.id === stage.id && "bg-blue-50/80"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: stage.color }}
                />
                <div className="flex-1">
                  <span className={cn(
                    "text-sm",
                    currentStage?.id === stage.id ? "font-medium text-blue-700" : "text-gray-700"
                  )}>
                    {stage.title}
                  </span>
                  {stage.is_fixed && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {stage.is_won ? "Ganho" : stage.is_lost ? "Perdido" : "Sistema"}
                    </Badge>
                  )}
                </div>
                {currentStage?.id === stage.id && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
