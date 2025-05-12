
import { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanColumn as IKanbanColumn, KanbanLead, FIXED_COLUMN_IDS } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { LeadCard } from "./LeadCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface KanbanColumnProps {
  column: IKanbanColumn;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
}

export const KanbanColumn = ({ 
  column, 
  onOpenLeadDetail, 
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost
}: KanbanColumnProps) => {
  const [editingColumn, setEditingColumn] = useState<IKanbanColumn | null>(null);
  
  const updateColumn = () => {
    if (!editingColumn || !editingColumn.title.trim()) return;
    onColumnUpdate(editingColumn);
    setEditingColumn(null);
  };

  const isFixed = column.isFixed === true;
  
  // Updated column title display
  const displayTitle = column.id === FIXED_COLUMN_IDS.NEW_LEAD ? "Entrada de leads" : column.title;

  return (
    <div 
      key={column.id} 
      className={cn(
        "flex-shrink-0 w-80 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg border overflow-hidden flex flex-col",
        isFixed ? "border-ticlin" : "border-gray-200 dark:border-gray-700"
      )}
    >
      <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h3 className={cn("font-medium", isFixed && "text-ticlin")}>{displayTitle}</h3>
        <div className="flex items-center gap-1">
          <span className="bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs">
            {column.leads.length}
          </span>
          
          {!isFixed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Etapa</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Nome da etapa"
                      value={editingColumn?.title || column.title}
                      onChange={(e) => setEditingColumn({
                        ...column,
                        title: e.target.value
                      })}
                      className="mt-4"
                    />
                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button variant="outline" onClick={() => setEditingColumn(null)}>
                          Cancelar
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button 
                          className="bg-ticlin hover:bg-ticlin/90 text-black"
                          onClick={updateColumn}
                        >
                          Salvar
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Excluir Etapa</DialogTitle>
                    </DialogHeader>
                    <p className="mt-4">
                      Tem certeza que deseja excluir a etapa "{column.title}"? 
                      Todos os leads nesta etapa também serão excluídos.
                    </p>
                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button 
                          variant="destructive"
                          onClick={() => onColumnDelete(column.id)}
                        >
                          Excluir
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-220px)]"
          >
            {column.leads.map((lead, index) => (
              <Draggable
                key={lead.id}
                draggableId={lead.id}
                index={index}
              >
                {(provided) => (
                  <LeadCard 
                    lead={lead} 
                    provided={provided} 
                    onClick={() => onOpenLeadDetail(lead)} 
                    onOpenChat={onOpenChat ? () => onOpenChat(lead) : undefined}
                    onMoveToWon={onMoveToWonLost ? () => onMoveToWonLost(lead, "won") : undefined}
                    onMoveToLost={onMoveToWonLost ? () => onMoveToWonLost(lead, "lost") : undefined}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
