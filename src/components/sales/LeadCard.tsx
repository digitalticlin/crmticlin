import { KanbanLead } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { LeadCardContent } from "./lead/LeadCardContent";
import { LeadCardTags } from "./lead/LeadCardTags";
import { LeadCardActions } from "./lead/LeadCardActions";
import { Check } from "lucide-react";
import React, { memo, useRef, useState } from "react";
import { MassSelectionCoordinatedReturn } from "@/hooks/useMassSelectionCoordinated";

interface LeadCardProps {
  lead: KanbanLead;
  onClick: () => void;
  onOpenChat?: () => void;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  isWonLostView?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionCoordinatedReturn;
}

export const LeadCard = memo(({
  lead,
  onClick,
  onOpenChat,
  onMoveToWon,
  onMoveToLost,
  onReturnToFunnel,
  isWonLostView = false,
  onMouseEnter,
  onMouseLeave,
  wonStageId,
  lostStageId,
  massSelection
}: LeadCardProps) => {

  // Se não tiver massSelection via props, usar valores padrão
  const effectiveMassSelection = massSelection || {
    selectedLeads: new Set(),
    isSelectionMode: false,
    toggleLead: () => {},
    isLeadSelected: () => false
  };

  const { selectedLeads, isSelectionMode, toggleLead, isLeadSelected } = effectiveMassSelection;
  const isSelected = isLeadSelected ? isLeadSelected(lead.id) : selectedLeads.has(lead.id);
  
  // Removido sistema de detecção - DndDraggableCard cuida disso
  
  // Debug logs removidos para produção
  const isWon = isWonLostView && lead.columnId === wonStageId;
  const isLost = isWonLostView && lead.columnId === lostStageId;
  
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as Element;
    const chatIconArea = target.closest('.chat-icon-area');

    // Se clicou no ícone de chat, abrir chat
    if (chatIconArea && onOpenChat) {
      e.preventDefault();
      e.stopPropagation();
      onOpenChat();
      return;
    }

    // Se estiver em modo seleção
    if (isSelectionMode) {
      toggleLead(lead.id);
      return;
    }

    // RESTANTE DO CARD: ativar DnD ou onClick padrão
    // Não prevenir - deixar DnD funcionar
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLead(lead.id);
  };

  return (
    <div
      className={cn(
        // Base do card - design glassmórfico com padding reduzido
        "bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass-lg mb-2 rounded-xl p-1.5 cursor-pointer group",
        "w-[98.5%] max-w-[380px] mx-auto",
        
        // Estados normais - hover e transições (não aplicar hover se em modo seleção)
        !isSelectionMode && "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-white/50",
        isSelectionMode && "transition-all duration-200",
        
        // Estados especiais para Won/Lost
        isWon && "border-l-[4px] border-l-green-500 bg-green-50/20",
        isLost && "border-l-[4px] border-l-red-500 bg-red-50/20",
        
        // Estado selecionado - borda azul destacada e background mais visível
        isSelected && "ring-2 ring-blue-500 border-blue-400 bg-blue-100/30 shadow-blue-200",
        
        // Modo seleção ativo - cursor de seleção
        isSelectionMode && !isSelected && "cursor-pointer hover:ring-1 hover:ring-blue-300 hover:bg-blue-50/10"
      )}
      onClick={handleCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        pointerEvents: 'auto',
        zIndex: 10,
        position: 'relative'
      }}
    >
      {/* Checkbox de seleção - aparece apenas no modo seleção */}
      {isSelectionMode && (
        <div 
          className="selection-checkbox absolute -top-2 -right-2 z-30"
          onClick={handleCheckboxClick}
        >
          <div className={cn(
            "w-6 h-6 rounded-full border-2 bg-white shadow-lg cursor-pointer transition-all duration-200",
            "flex items-center justify-center",
            isSelected 
              ? "bg-blue-500 border-blue-500 text-white" 
              : "border-gray-300 hover:border-blue-400"
          )}>
            {isSelected && <Check size={14} />}
          </div>
        </div>
      )}

      {/* Glassmorphism overlay padrão */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl pointer-events-none" />
      
      {/* Content sempre visível */}
      <div className="relative z-20">
        <LeadCardContent lead={lead} isWonLostView={isWonLostView} lostStageId={lostStageId} />
        
        {/* Tags and Actions Footer - altura bem reduzida */}
        <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/30">
          <div className="flex-1 min-w-0 mr-2 max-w-[70%]">
            <LeadCardTags tags={lead.tags || []} maxTags={2} />
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
});

