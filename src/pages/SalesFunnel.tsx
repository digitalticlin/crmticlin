
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, MoreVertical, Edit, Trash2, X, MessageSquare, Tag, Save } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Types for our Kanban board
interface KanbanTag {
  id: string;
  name: string;
  color: string;
}

interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  tags: KanbanTag[];
  notes?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  leads: KanbanLead[];
}

export default function SalesFunnel() {
  // State for the Kanban board
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: "column-1",
      title: "Novos Leads",
      leads: [
        {
          id: "lead-1",
          name: "João Silva",
          phone: "+55 11 98765-4321",
          lastMessage: "Olá, gostaria de saber mais sobre o serviço",
          lastMessageTime: "10:30",
          tags: [
            { id: "tag-1", name: "Novo", color: "bg-blue-400" },
            { id: "tag-2", name: "Urgente", color: "bg-red-400" },
          ],
        },
        {
          id: "lead-2",
          name: "Maria Oliveira",
          phone: "+55 11 91234-5678",
          lastMessage: "Qual o preço do plano básico?",
          lastMessageTime: "09:15",
          tags: [
            { id: "tag-1", name: "Novo", color: "bg-blue-400" },
          ],
          notes: "Cliente interessado no plano básico, enviar proposta",
        },
      ],
    },
    {
      id: "column-2",
      title: "Em Contato",
      leads: [
        {
          id: "lead-3",
          name: "Pedro Santos",
          phone: "+55 11 97777-8888",
          lastMessage: "Vou analisar a proposta, obrigado!",
          lastMessageTime: "Ontem",
          tags: [
            { id: "tag-3", name: "Proposta Enviada", color: "bg-purple-400" },
          ],
        },
      ],
    },
    {
      id: "column-3",
      title: "Negociação",
      leads: [
        {
          id: "lead-4",
          name: "Ana Pereira",
          phone: "+55 11 96666-5555",
          lastMessage: "Podemos agendar uma reunião?",
          lastMessageTime: "Seg",
          tags: [
            { id: "tag-4", name: "Reunião", color: "bg-green-400" },
            { id: "tag-5", name: "Desconto", color: "bg-amber-400" },
          ],
        },
      ],
    },
    {
      id: "column-4",
      title: "Convertidos",
      leads: [],
    },
  ]);

  // State for new column dialog
  const [newColumnTitle, setNewColumnTitle] = useState("");
  
  // State for edited column
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  
  // State for the lead detail sidebar
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  
  // State for tags management
  const [availableTags, setAvailableTags] = useState<KanbanTag[]>([
    { id: "tag-1", name: "Novo", color: "bg-blue-400" },
    { id: "tag-2", name: "Urgente", color: "bg-red-400" },
    { id: "tag-3", name: "Proposta Enviada", color: "bg-purple-400" },
    { id: "tag-4", name: "Reunião", color: "bg-green-400" },
    { id: "tag-5", name: "Desconto", color: "bg-amber-400" },
    { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
    { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" },
  ]);

  // Add a new column
  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title: newColumnTitle,
      leads: [],
    };
    
    setColumns([...columns, newColumn]);
    setNewColumnTitle("");
  };

  // Update a column
  const updateColumn = () => {
    if (!editingColumn || !editingColumn.title.trim()) return;
    
    setColumns(columns.map(col => 
      col.id === editingColumn.id ? { ...col, title: editingColumn.title } : col
    ));
    
    setEditingColumn(null);
  };

  // Delete a column
  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter(col => col.id !== columnId));
  };

  // Handle drag and drop
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newLeads = Array.from(sourceColumn.leads);
      const [removed] = newLeads.splice(source.index, 1);
      newLeads.splice(destination.index, 0, removed);

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            leads: newLeads,
          };
        }
        return col;
      });

      setColumns(newColumns);
    } else {
      // Moving from one column to another
      const sourceLeads = Array.from(sourceColumn.leads);
      const [removed] = sourceLeads.splice(source.index, 1);
      const destLeads = Array.from(destColumn.leads);
      destLeads.splice(destination.index, 0, removed);

      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            leads: sourceLeads,
          };
        }
        if (col.id === destination.droppableId) {
          return {
            ...col,
            leads: destLeads,
          };
        }
        return col;
      });

      setColumns(newColumns);
    }
  };

  // Open lead detail
  const openLeadDetail = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  };

  // Toggle tag on a lead
  const toggleTagOnLead = (tagId: string) => {
    if (!selectedLead) return;

    const tag = availableTags.find(t => t.id === tagId);
    if (!tag) return;

    const hasTag = selectedLead.tags.some(t => t.id === tagId);
    
    const updatedLead = {
      ...selectedLead,
      tags: hasTag
        ? selectedLead.tags.filter(t => t.id !== tagId)
        : [...selectedLead.tags, tag]
    };
    
    setSelectedLead(updatedLead);
    
    // Update the lead in the columns
    setColumns(columns.map(col => ({
      ...col,
      leads: col.leads.map(l => 
        l.id === selectedLead.id ? updatedLead : l
      )
    })));
  };

  // Update lead notes
  const updateLeadNotes = (notes: string) => {
    if (!selectedLead) return;
    
    const updatedLead = {
      ...selectedLead,
      notes
    };
    
    setSelectedLead(updatedLead);
    
    // Update the lead in the columns
    setColumns(columns.map(col => ({
      ...col,
      leads: col.leads.map(l => 
        l.id === selectedLead.id ? updatedLead : l
      )
    })));
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-muted-foreground">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Etapa</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Nome da etapa"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="mt-4"
                />
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button 
                      className="bg-ticlin hover:bg-ticlin/90 text-black"
                      onClick={addColumn}
                    >
                      Adicionar
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Kanban Board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6">
              {columns.map((column) => (
                <div 
                  key={column.id} 
                  className="flex-shrink-0 w-80 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                >
                  <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium">{column.title}</h3>
                    <div className="flex items-center gap-1">
                      <span className="bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs">
                        {column.leads.length}
                      </span>
                      
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
                                    onClick={() => deleteColumn(column.id)}
                                  >
                                    Excluir
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white dark:bg-gray-800 mb-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-3 cursor-pointer"
                                onClick={() => openLeadDetail(lead)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{lead.name}</h4>
                                  <span className="text-xs text-muted-foreground">{lead.lastMessageTime}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{lead.lastMessage}</p>
                                <div className="flex flex-wrap gap-1">
                                  {lead.tags.map((tag) => (
                                    <Badge key={tag.id} className={cn("text-black", tag.color)}>
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </main>
      
      {/* Lead Detail Sidebar */}
      <Sheet open={isLeadDetailOpen} onOpenChange={setIsLeadDetailOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold">{selectedLead.name}</SheetTitle>
                <SheetDescription>{selectedLead.phone}</SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Tags */}
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-1" /> Etiquetas
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => (
                      <Badge 
                        key={tag.id} 
                        className={cn(
                          "cursor-pointer text-black",
                          selectedLead.tags.some(t => t.id === tag.id) ? tag.color : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300"
                        )}
                        onClick={() => toggleTagOnLead(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Observações</h3>
                  <Textarea 
                    placeholder="Adicione notas sobre este lead"
                    value={selectedLead.notes || ""}
                    onChange={(e) => updateLeadNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                {/* Chat Preview */}
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" /> Conversa
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">{selectedLead.lastMessageTime}</span>
                      <span className="text-xs text-muted-foreground">WhatsApp</span>
                    </div>
                    <p className="text-sm">{selectedLead.lastMessage}</p>
                  </div>
                  
                  <Button 
                    className="w-full mt-2 bg-ticlin hover:bg-ticlin/90 text-black"
                    onClick={() => {
                      setIsLeadDetailOpen(false);
                      // In a real app, this would navigate to the chat page with this contact
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir Chat Completo
                  </Button>
                </div>
              </div>
              
              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsLeadDetailOpen(false)}>
                  Fechar
                </Button>
                <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Contato
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
