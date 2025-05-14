
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { ColumnHeader } from "./column/ColumnHeader";
import { ColumnContent } from "./column/ColumnContent";
import { ColumnColorBar } from "./column/ColumnColorBar";
import React, { useState } from "react";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  isWonLostView?: boolean;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  renderClone?: any; // add renderClone to propagate to ColumnContent
}

// Nova implementação: controlar se algum card está em hover para alternar overflow
export const KanbanColumn = ({
  column,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  isWonLostView = false,
  onReturnToFunnel,
  renderClone,
}: KanbanColumnProps) => {
  const columnColor = column.color || "#e0e0e0";
  // Estado local para hover em qualquer card da coluna
  const [isAnyCardHovered, setIsAnyCardHovered] = useState(false);

  // Funções passadas ao LeadsList para delegar hover
  const handleCardMouseEnter = () => setIsAnyCardHovered(true);
  const handleCardMouseLeave = () => setIsAnyCardHovered(false);

  return (
    <div
      className="relative glass bg-white/50 dark:bg-black/30 rounded-3xl border-none shadow-glass-lg overflow-hidden flex flex-col min-w-[430px] max-w-[470px] w-full md:h-[72vh] h-[540px]"
      style={{
        boxShadow: "0 8px 40px 0 rgba(31,38,135,0.13)",
        border: "1.5px solid rgba(255,255,255,0.15)",
        marginBottom: 0,
        zIndex: 10
      }}
    >
      <ColumnColorBar color={columnColor} />
      <ColumnHeader
        column={column}
        onColumnUpdate={onColumnUpdate}
        onColumnDelete={onColumnDelete}
      />
      {/* Limite de altura, ativando scroll apenas no conteúdo dos cards */}
      <div
        className="flex-1 px-1 pb-1"
        style={{
          overflowY: isAnyCardHovered ? "visible" : "auto", // Fica visível no hover de qualquer card
          transition: "overflow 0.15s",
        }}
      >
        <ColumnContent
          columnId={column.id}
          leads={column.leads}
          onOpenLeadDetail={onOpenLeadDetail}
          onOpenChat={onOpenChat}
          onMoveToWonLost={!isWonLostView ? onMoveToWonLost : undefined}
          onReturnToFunnel={isWonLostView ? onReturnToFunnel : undefined}
          isWonLostView={isWonLostView}
          renderClone={renderClone}
          // Handlers para controlar overflow a partir do LeadsList
          onAnyCardMouseEnter={handleCardMouseEnter}
          onAnyCardMouseLeave={handleCardMouseLeave}
        />
      </div>
    </div>
  );
};
