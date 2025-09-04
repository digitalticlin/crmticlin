import React, { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { LeadCard } from "../LeadCard";
import { KanbanLead } from "@/types/kanban";

interface LeadsListProps {
  columnId: string;
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  renderClone?: any;
  onAnyCardMouseEnter?: () => void;
  onAnyCardMouseLeave?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

const ITEM_HEIGHT = 120; // Altura estimada de cada card
const MAX_VISIBLE_ITEMS = 50; // Limite de itens visíveis para performance

export const LeadsList: React.FC<LeadsListProps> = React.memo(({
  columnId,
  leads,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  renderClone,
  onAnyCardMouseEnter,
  onAnyCardMouseLeave,
  wonStageId,
  lostStageId
}) => {
  // Limitar leads para performance (mostra primeiros 50)
  const limitedLeads = useMemo(() => {
    if (leads.length <= MAX_VISIBLE_ITEMS) return leads;
    return leads.slice(0, MAX_VISIBLE_ITEMS);
  }, [leads]);

  // Adaptar onMoveToWonLost para as funções individuais esperadas pelo LeadCard
  const handleMoveToWon = (lead: KanbanLead) => {
    if (onMoveToWonLost) {
      onMoveToWonLost(lead, "won");
    }
  };

  const handleMoveToLost = (lead: KanbanLead) => {
    if (onMoveToWonLost) {
      onMoveToWonLost(lead, "lost");
    }
  };

  const renderItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const lead = limitedLeads[index];
    if (!lead) return null;

    return (
      <div 
        style={style}
        onMouseEnter={onAnyCardMouseEnter}
        onMouseLeave={onAnyCardMouseLeave}
      >
        <LeadCard
          lead={lead}
          onClick={() => onOpenLeadDetail(lead)}
          onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
          onMoveToWon={() => handleMoveToWon(lead)}
          onMoveToLost={() => handleMoveToLost(lead)}
          onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
          isWonLostView={isWonLostView}
          wonStageId={wonStageId}
          lostStageId={lostStageId}
        />
      </div>
    );
  };

  // Para poucos leads, renderizar normalmente
  if (limitedLeads.length <= 10) {
    return (
      <>
        {limitedLeads.map((lead) => (
          <div
            key={lead.id}
            onMouseEnter={onAnyCardMouseEnter}
            onMouseLeave={onAnyCardMouseLeave}
          >
            <LeadCard
              lead={lead}
              onClick={() => onOpenLeadDetail(lead)}
              onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
              onMoveToWon={() => handleMoveToWon(lead)}
              onMoveToLost={() => handleMoveToLost(lead)}
              onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
              isWonLostView={isWonLostView}
              wonStageId={wonStageId}
              lostStageId={lostStageId}
            />
          </div>
        ))}
        {renderClone}
      </>
    );
  }

  // Para muitos leads, usar virtualização
  return (
    <div className="relative">
      <List
        height={Math.min(600, limitedLeads.length * ITEM_HEIGHT)}
        itemCount={limitedLeads.length}
        itemSize={ITEM_HEIGHT}
        className="kanban-column-scrollbar"
      >
        {renderItem}
      </List>
      
      {leads.length > MAX_VISIBLE_ITEMS && (
        <div className="p-2 text-center text-xs text-gray-500 bg-yellow-50 border-t">
          Mostrando {MAX_VISIBLE_ITEMS} de {leads.length} leads
          <br />
          <span className="text-yellow-600">Use filtros para ver mais</span>
        </div>
      )}
      
      {renderClone}
    </div>
  );
});

LeadsList.displayName = 'LeadsList';