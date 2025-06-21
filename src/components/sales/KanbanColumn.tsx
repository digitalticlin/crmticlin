
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

  // Verificar se o estágio é fixo baseado no título
  const isFixedStage = column.title === "GANHO" || column.title === "PERDIDO" || column.title === "Entrada de Leads" || column.isFixed;

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== column.title && onUpdateColumn) {
      try {
        await onUpdateColumn({ ...column, title: editTitle.trim() });
        setIsEditing(false);
      } catch (error: any) {
        toast.error(error.message || "Erro ao atualizar estágio");
        setEditTitle(column.title); // Revert on error
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
    <Draggable draggableId={column.id} index={index} isDragDisabled={isFixedStage}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-gray-50 rounded-lg p-4 min-w-[300px] max-w-[300px] flex flex-col"
        >
          {/* Header */}
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between mb-4"
          >
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

            {/* Actions - apenas mostrar se não for estágio fixo e não for view de ganhos/perdidos */}
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
            className="h-1 rounded-full mb-4"
            style={{ backgroundColor: column.color || "#e0e0e0" }}
          />

          {/* Leads */}
          <Droppable droppableId={column.id} type="lead">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex-1 space-y-3 min-h-[200px] transition-colors",
                  snapshot.isDraggingOver && "bg-blue-50"
                )}
              >
                {column.leads.map((lead, index) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={index}
                    onClick={() => onOpenLeadDetail(lead)}
                    onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                    onMoveToWonLost={onMoveToWonLost ? (status: "won" | "lost") => onMoveToWonLost(lead, status) : undefined}
                    onReturnToFunnel={onReturnToFunnel ? () => onReturnToFunnel(lead) : undefined}
                    isInWonLostStage={column.id === wonStageId || column.id === lostStageId}
                    isWonLostView={isWonLostView}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}
