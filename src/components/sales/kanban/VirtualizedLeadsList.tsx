
import React, { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { Draggable } from "react-beautiful-dnd";
import { LeadCard } from "../LeadCard";
import { KanbanLead } from "@/types/kanban";

interface VirtualizedLeadsListProps {
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWon?: (lead: KanbanLead) => void;
  onMoveToLost?: (lead: KanbanLead) => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  maxHeight?: number;
}

const ITEM_HEIGHT = 100; // Altura reduzida dos cards (era 120)
const MAX_VISIBLE_ITEMS = 50; // Limite de itens visíveis para performance

export const VirtualizedLeadsList: React.FC<VirtualizedLeadsListProps> = React.memo(({
  leads,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWon,
  onMoveToLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  maxHeight = 600
}) => {
  // Limitar leads para performance (mostra primeiros 50)
  const limitedLeads = useMemo(() => {
    if (leads.length <= MAX_VISIBLE_ITEMS) return leads;
    return leads.slice(0, MAX_VISIBLE_ITEMS);
  }, [leads]);

  const renderItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const lead = limitedLeads[index];
    if (!lead) return null;

    return (
      <div style={style}>
        <Draggable key={lead.id} draggableId={lead.id} index={index}>
          {(provided, snapshot) => (
            <LeadCard
              lead={lead}
              provided={provided}
              onClick={() => onOpenLeadDetail(lead)}
              onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
              onMoveToWon={onMoveToWon ? () => onMoveToWon(lead) : undefined}
              onMoveToLost={onMoveToLost ? () => onMoveToLost(lead) : undefined}
              onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
              isWonLostView={isWonLostView}
              wonStageId={wonStageId}
              lostStageId={lostStageId}
              isDragging={snapshot.isDragging}
            />
          )}
        </Draggable>
      </div>
    );
  };

  // Para poucos leads, renderizar normalmente
  if (limitedLeads.length <= 10) {
    return (
      <>
        {limitedLeads.map((lead, index) => (
          <Draggable key={lead.id} draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
              <LeadCard
                lead={lead}
                provided={provided}
                onClick={() => onOpenLeadDetail(lead)}
                onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                onMoveToWon={onMoveToWon ? () => onMoveToWon(lead) : undefined}
                onMoveToLost={onMoveToLost ? () => onMoveToLost(lead) : undefined}
                onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
                isWonLostView={isWonLostView}
                wonStageId={wonStageId}
                lostStageId={lostStageId}
                isDragging={snapshot.isDragging}
              />
            )}
          </Draggable>
        ))}
      </>
    );
  };

  // Para muitos leads, usar virtualização
  return (
    <div className="relative">
      <List
        height={Math.min(maxHeight, limitedLeads.length * ITEM_HEIGHT)}
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
    </div>
  );
});

VirtualizedLeadsList.displayName = 'VirtualizedLeadsList';
