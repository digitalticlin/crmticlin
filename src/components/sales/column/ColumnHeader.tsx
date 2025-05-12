
import { useState } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KanbanColumn, FIXED_COLUMN_IDS } from "@/types/kanban";
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

interface ColumnHeaderProps {
  column: KanbanColumn;
  onColumnUpdate: (updatedColumn: KanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
}

export const ColumnHeader = ({ 
  column, 
  onColumnUpdate,
  onColumnDelete 
}: ColumnHeaderProps) => {
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  
  const updateColumn = () => {
    if (!editingColumn || !editingColumn.title.trim()) return;
    onColumnUpdate(editingColumn);
    setEditingColumn(null);
  };

  const isFixed = column.isFixed === true;
  
  // Updated column title display
  const displayTitle = column.id === FIXED_COLUMN_IDS.NEW_LEAD ? "Entrada de leads" : column.title;

  return (
    <div className="p-3 flex items-center justify-between border-b border-slate-200/20">
      <h3 className={cn("font-medium", isFixed && "text-ticlin")}>{displayTitle}</h3>
      <div className="flex items-center gap-1">
        <span className="bg-white/10 dark:bg-black/20 rounded-full px-2 py-0.5 text-xs">
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
  );
};
