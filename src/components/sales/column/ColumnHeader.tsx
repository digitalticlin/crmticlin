
import { useState } from "react";
import { Circle, Edit, Trash2, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IKanbanColumn } from "@/types/kanban";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface ColumnHeaderProps {
  column: IKanbanColumn;
  isFixed: boolean;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  getColumnColor: () => string;
}

export const ColumnHeader = ({
  column,
  isFixed,
  onColumnUpdate,
  onColumnDelete,
  getColumnColor
}: ColumnHeaderProps) => {
  const [editingColumn, setEditingColumn] = useState<IKanbanColumn | null>(null);
  
  const updateColumn = () => {
    if (!editingColumn || !editingColumn.title.trim()) return;
    onColumnUpdate(editingColumn);
    setEditingColumn(null);
  };

  return (
    <div className="p-3 flex items-center justify-between border-b border-gray-600/40 bg-black/50">
      <div className="flex items-center">
        <Circle className={cn("h-3 w-3 mr-2", getColumnColor())} fill={getColumnColor()} />
        <h3 className={cn("font-semibold text-white", isFixed && "text-white")}>
          {column.title}
        </h3>
        <span className="ml-1.5 bg-black/30 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {column.leads.length}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white">
          <Plus className="h-4 w-4" />
        </Button>
        
        {!isFixed && (
          <ColumnActions 
            column={column} 
            onColumnUpdate={onColumnUpdate} 
            onColumnDelete={onColumnDelete}
            editingColumn={editingColumn}
            setEditingColumn={setEditingColumn}
            updateColumn={updateColumn}
          />
        )}
      </div>
    </div>
  );
};

interface ColumnActionsProps {
  column: IKanbanColumn;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  editingColumn: IKanbanColumn | null;
  setEditingColumn: (column: IKanbanColumn | null) => void;
  updateColumn: () => void;
}

const ColumnActions = ({
  column,
  onColumnUpdate,
  onColumnDelete,
  editingColumn,
  setEditingColumn,
  updateColumn
}: ColumnActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <MoreVertical className="h-4 w-4 text-white" />
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
);
