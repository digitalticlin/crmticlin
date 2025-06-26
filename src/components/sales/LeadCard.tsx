
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
    // RADICAL: Não bloquear cliques durante drag - deixar o RBD gerenciar
    if (onOpenChat) onOpenChat();
    else onClick();
  };

  console.log('[LeadCard] 🃏 RADICAL - Card:', lead.name, 'isDragging:', isDragging);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        // Base do card - design glassmórfico
        "bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg mb-4 rounded-xl p-4 cursor-pointer group relative",
        "w-[98.5%] max-w-[380px] mx-auto",
        
        // RADICAL: Estados simplificados - sem conflitos
        !isDragging && "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-white/50",
        
        // CRÍTICO: Estado de drag otimizado para clone VISÍVEL
        isDragging && [
          "opacity-90", // Levemente transparente mas VISÍVEL
          "shadow-2xl", // Sombra forte
          "border-2 border-blue-400/60", // Borda destacada
          "bg-white/90", // Fundo mais opaco
          "scale-[1.05]", // Levemente maior
          "rotate-2", // Rotação sutil
          "z-[9999]" // Z-index alto
        ],
        
        // Estados especiais para Won/Lost
        isWon && "border-l-[4px] border-l-green-500 bg-green-50/20",
        isLost && "border-l-[4px] border-l-red-500 bg-red-50/20"
      )}
      style={{
        // RADICAL: Usar APENAS os estilos do react-beautiful-dnd
        ...provided.draggableProps.style,
        
        // CRÍTICO: Garantir que o clone seja sempre visível
        ...(isDragging && {
          // Manter o transform do RBD mas garantir visibilidade
          transform: provided.draggableProps.style?.transform || 'none',
          // NUNCA usar pointerEvents: 'none' durante drag
          pointerEvents: 'auto',
          // Garantir posicionamento correto
          position: 'relative',
          zIndex: 9999
        })
      }}
      onClick={handleCardClick}
      onMouseEnter={!isDragging ? onMouseEnter : undefined}
      onMouseLeave={!isDragging ? onMouseLeave : undefined}
    >
      {/* RADICAL: Overlay de drag VISÍVEL e destacado */}
      {isDragging && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/30 via-white/40 to-blue-400/30 animate-pulse pointer-events-none z-10" />
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
