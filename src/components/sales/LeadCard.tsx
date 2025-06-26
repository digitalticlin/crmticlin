
import { KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { DraggableProvided } from "react-beautiful-dnd";
import { LeadCardContent } from "./lead/LeadCardContent";
import { LeadCardTags } from "./lead/LeadCardTags";
import { LeadCardActions } from "./lead/LeadCardActions";
import React from "react";

interface LeadCardProps {
  lead: KanbanLead;
  provided: DraggableProvided;
  onClick: () => void;
  onOpenChat?: () => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  isWonLostView?: boolean;
  isDragging?: boolean;
  isClone?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

export const LeadCard = ({
  lead,
  provided,
  onClick,
  onOpenChat,
  onMoveToWon,
  onMoveToLost,
  onReturnToFunnel,
  isWonLostView = false,
  isDragging = false,
  isClone = false,
  onMouseEnter,
  onMouseLeave,
  wonStageId,
  lostStageId
}: LeadCardProps) => {
  const isWon = isWonLostView && lead.columnId === wonStageId;
  const isLost = isWonLostView && lead.columnId === lostStageId;
  
  const handleCardClick = (e: React.MouseEvent) => {
    if (onOpenChat) onOpenChat();
    else onClick();
  };

  console.log('[LeadCard] 🃏 CLONE VISÍVEL - Card:', lead.name, 'isDragging:', isDragging);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        // Base do card - design glassmórfico
        "bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg mb-4 rounded-xl p-4 cursor-pointer group",
        "w-[98.5%] max-w-[380px] mx-auto",
        
        // Estados normais - apenas quando NÃO está em drag
        !isDragging && "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-white/50",
        
        // CORREÇÃO CRÍTICA: Estados de drag APENAS visuais - clone 100% visível
        isDragging && [
          "!opacity-100", // Força opacidade total
          "!shadow-2xl", // Sombra máxima
          "!border-2 !border-blue-500", // Borda azul destacada
          "!bg-white/95", // Fundo mais opaco
          "!scale-110", // Maior para destaque
          "!z-[9999]" // Z-index máximo
        ],
        
        // Estados especiais para Won/Lost
        isWon && "border-l-[4px] border-l-green-500 bg-green-50/20",
        isLost && "border-l-[4px] border-l-red-500 bg-red-50/20"
      )}
      style={{
        // CRÍTICO: Usar APENAS os estilos do react-beautiful-dnd
        ...provided.draggableProps.style,
        
        // CORREÇÃO RADICAL: Durante drag, ZERO interferência no positioning
        ...(isDragging && {
          // Garantir máxima visibilidade do clone
          opacity: '1 !important',
          visibility: 'visible !important',
          pointerEvents: 'auto !important',
          zIndex: 9999,
          // NUNCA sobrescrever transform, position, top, left - RBD controla
        })
      }}
      onClick={!isDragging ? handleCardClick : undefined}
      onMouseEnter={!isDragging ? onMouseEnter : undefined}
      onMouseLeave={!isDragging ? onMouseLeave : undefined}
    >
      {/* NOVO: Overlay de destaque APENAS durante drag para máxima visibilidade */}
      {isDragging && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(59, 130, 246, 0.2) 100%)',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            border: '2px solid rgba(59, 130, 246, 0.8)'
          }}
        />
      )}
      
      {/* Glassmorphism overlay padrão */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl pointer-events-none",
        isDragging && "from-white/20 to-white/10"
      )} />
      
      {/* Content sempre visível */}
      <div className="relative z-20">
        <LeadCardContent lead={lead} isWonLostView={isWonLostView} lostStageId={lostStageId} />
        
        {/* Tags and Actions Footer */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/30">
          <div className="flex-1 min-w-0 mr-2">
            <LeadCardTags tags={lead.tags} />
          </div>
          <LeadCardActions
            leadId={lead.id}
            leadColumnId={lead.columnId}
            onMoveToWon={onMoveToWon}
            onMoveToLost={onMoveToLost}
            onReturnToFunnel={onReturnToFunnel}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
            isWonLostView={isWonLostView}
          />
        </div>
      </div>
    </div>
  );
};
