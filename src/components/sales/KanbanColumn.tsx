
import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MoreVertical, Edit, Trash2, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LeadCard } from "./LeadCard";
import { KanbanColumn as KanbanColumnType, KanbanLead } from "@/types/kanban";
import { toast } from "sonner";

interface KanbanColumnProps {
  column: KanbanColumnType;
  index: number;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onUpdateColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
}

export function KanbanColumn({
  column,
  index,
  onOpenLeadDetail,
  onUpdateColumn,
  onDeleteColumn,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const isFixedStage = column.title === "GANHO" || column.title === "PERDIDO" || column.title === "Entrada de Leads" || column.isFixed;

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== column.title && onUpdateColumn) {
      try {
        await onUpdateColumn({ ...column, title: editTitle.trim() });
        setIsEditing(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar estágio");
        setEditTitle(column.title);
      }
    } else {
      setIsEditing(false);
      setEditTitle(column.title);
    }
  };

  const handleDelete = async () => {
    if (onDeleteColumn) {
      try {
        await onDeleteColumn(column.id);
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar estágio");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(column.title);
    }
  };

  return (
    <div className="bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl px-1.5 py-3 min-w-[300px] max-w-[300px] flex flex-col h-full transition-all duration-300 hover:bg-white/25 hover:shadow-glass-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 flex-1">
          {isFixedStage && <Lock className="h-4 w-4 text-gray-500" />}
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyPress}
              className="text-sm font-medium bg-white"
              autoFocus
            />
          ) : (
            <h3 
              className={cn(
                "text-sm font-medium text-gray-900 truncate",
                isFixedStage && "text-gray-600"
              )}
              style={{ color: column.color }}
            >
              {column.title}
            </h3>
          )}
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {column.leads.length}
          </span>
        </div>

        {/* Actions */}
        {!isFixedStage && !isWonLostView && (onUpdateColumn || onDeleteColumn) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onUpdateColumn && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDeleteColumn && (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Color bar */}
      <div
        className="h-1 rounded-full mb-4 mx-1"
        style={{ backgroundColor: column.color || "#e0e0e0" }}
      />

      {/* Droppable otimizado para RBD */}
      <Droppable droppableId={column.id} type="lead">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 rounded-xl px-0.5 py-2 kanban-column-scrollbar overflow-y-auto",
              snapshot.isDraggingOver && "bg-blue-50/50 border-2 border-dashed border-blue-400/70 transition-all duration-150"
            )}
            style={{
              minHeight: "400px",
              maxHeight: "calc(100vh - 200px)"
            }}
          >
            {/* Renderização otimizada com limite */}
            {column.leads.slice(0, 50).map((lead, leadIndex) => (
              <Draggable key={lead.id} draggableId={lead.id} index={leadIndex}>
                {(provided, snapshot) => (
                  <LeadCard
                    lead={lead}
                    provided={provided}
                    onClick={() => onOpenLeadDetail(lead)}
                    onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                    onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined}
                    onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined}
                    onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
                    isWonLostView={isWonLostView}
                    wonStageId={wonStageId}
                    lostStageId={lostStageId}
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Aviso se há mais leads que o limite */}
            {column.leads.length > 50 && (
              <div className="p-2 text-center text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded mx-1 mb-2">
                Mostrando 50 de {column.leads.length} leads
              </div>
            )}
            
            {/* Indicador de drop otimizado */}
            {snapshot.isDraggingOver && column.leads.length === 0 && (
              <div className="flex items-center justify-center h-20 text-blue-500/70 text-sm font-medium border-2 border-dashed border-blue-300/50 rounded-lg bg-blue-50/30">
                ↓ Solte o card aqui ↓
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
