
import { useState } from "react";
import { KanbanColumn, KanbanLead, KanbanTag, FIXED_COLUMN_IDS } from "@/types/kanban";
import { toast } from "sonner";

export const useSalesFunnel = () => {
  // State for the Kanban board with fixed columns
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: FIXED_COLUMN_IDS.NEW_LEAD,
      title: "ENTRADA DE LEAD",
      isFixed: true,
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
      id: FIXED_COLUMN_IDS.WON,
      title: "GANHO",
      isFixed: true,
      isHidden: true,
      leads: [
        {
          id: "lead-5",
          name: "Carlos Mendes",
          phone: "+55 11 99876-5432",
          lastMessage: "Fechado! Vou efetuar o pagamento hoje.",
          lastMessageTime: "3d",
          tags: [
            { id: "tag-6", name: "VIP", color: "bg-yellow-400" },
            { id: "tag-7", name: "2ª Compra", color: "bg-emerald-400" },
          ],
        }
      ],
    },
    {
      id: FIXED_COLUMN_IDS.LOST,
      title: "PERDIDO",
      isFixed: true,
      isHidden: true,
      leads: [
        {
          id: "lead-6",
          name: "Lucia Ferreira",
          phone: "+55 11 91111-2222",
          lastMessage: "Obrigada, mas optei por outro serviço.",
          lastMessageTime: "5d",
          tags: [
            { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" },
          ],
          notes: "Cliente achou o valor acima do orçamento, talvez retornar com promoção futura."
        }
      ],
    },
  ]);
  
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
    { id: "tag-8", name: "Preço Alto", color: "bg-orange-400" },
  ]);

  // Add a new column
  const addColumn = (title: string) => {
    if (!title.trim()) return;
    
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title,
      leads: [],
    };
    
    // Add the new column before the fixed hidden columns
    const visibleColumns = columns.filter(col => !col.isHidden);
    const hiddenColumns = columns.filter(col => col.isHidden);
    
    setColumns([...visibleColumns, newColumn, ...hiddenColumns]);
  };

  // Update a column
  const updateColumn = (updatedColumn: KanbanColumn) => {
    if (!updatedColumn || !updatedColumn.title.trim()) return;
    
    // Don't allow updating fixed columns
    if (updatedColumn.isFixed) {
      toast.error("Não é possível editar etapas padrão do sistema.");
      return;
    }
    
    setColumns(columns.map(col => 
      col.id === updatedColumn.id ? { ...col, title: updatedColumn.title } : col
    ));
  };

  // Delete a column
  const deleteColumn = (columnId: string) => {
    const columnToDelete = columns.find(col => col.id === columnId);
    
    // Don't allow deleting fixed columns
    if (columnToDelete?.isFixed) {
      toast.error("Não é possível excluir etapas padrão do sistema.");
      return;
    }
    
    // Move any leads in this column to the first column (NEW_LEAD)
    const columnLeads = columnToDelete?.leads || [];
    
    if (columnLeads.length > 0) {
      const newColumns = columns.map(col => {
        if (col.id === FIXED_COLUMN_IDS.NEW_LEAD) {
          return {
            ...col,
            leads: [...col.leads, ...columnLeads]
          };
        }
        return col;
      });
      
      setColumns(newColumns.filter(col => col.id !== columnId));
      toast.success("Coluna excluída e leads movidos para Entrada de Lead");
    } else {
      setColumns(columns.filter(col => col.id !== columnId));
      toast.success("Coluna excluída com sucesso");
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

  // Create a new tag
  const createTag = (name: string, color: string) => {
    const newTag: KanbanTag = {
      id: `tag-${Date.now()}`,
      name,
      color,
    };
    
    setAvailableTags([...availableTags, newTag]);
    
    // If a lead is selected, add the new tag to the lead
    if (selectedLead) {
      toggleTagOnLead(newTag.id);
    }
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

  // Simulate receiving a new lead from WhatsApp API
  const receiveNewLead = (lead: KanbanLead) => {
    setColumns(columns.map(col => {
      if (col.id === FIXED_COLUMN_IDS.NEW_LEAD) {
        return {
          ...col,
          leads: [lead, ...col.leads]
        };
      }
      return col;
    }));
    
    toast.success(`Novo lead recebido: ${lead.name}`, {
      description: "Lead adicionado automaticamente à etapa de entrada."
    });
  };

  return {
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    receiveNewLead
  };
};
