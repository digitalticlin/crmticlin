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
  const displayTitle = column.id === FIXED_COLUMN_IDS.NEW_LEAD ? "Entrada de leads" : column.title;

  return (
    <div className="p-4 flex items-center justify-between border-b border-slate-200/15 bg-transparent">
      <h3 className={cn("font-semibold font-inter text-lg truncate", isFixed && "text-ticlin")}>{displayTitle}</h3>
      <div className="flex items-center gap-2">
        <span className="bg-ticlin/20 text-ticlin font-bold rounded-xl px-3 py-0.5 text-xs">{column.leads.length}</span>
        {!isFixed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-ticlin group-hover:bg-ticlin/10 transition-all">
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
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="column-title" className="text-sm font-medium block mb-2">
                        Nome da etapa
                      </label>
                      <Input
                        id="column-title"
                        placeholder="Nome da etapa"
                        value={editingColumn?.title || column.title}
                        onChange={(e) => setEditingColumn({
                          ...(editingColumn || column),
                          title: e.target.value
                        })}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="column-color" className="text-sm font-medium block mb-2">
                        Cor da etapa
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="column-color"
                          type="color"
                          className="w-12 h-10 p-1 cursor-pointer"
                          value={editingColumn?.color || column.color || "#e5e7eb"}
                          onChange={(e) => setEditingColumn({
                            ...(editingColumn || column),
                            color: e.target.value
                          })}
                        />
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="#RRGGBB"
                            value={editingColumn?.color || column.color || "#e5e7eb"}
                            onChange={(e) => setEditingColumn({
                              ...(editingColumn || column),
                              color: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
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
