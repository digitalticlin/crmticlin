
import { useState } from "react";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";

export const useSalesFunnel = () => {
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
  const addColumn = (title: string) => {
    if (!title.trim()) return;
    
    const newColumn: KanbanColumn = {
      id: `column-${Date.now()}`,
      title,
      leads: [],
    };
    
    setColumns([...columns, newColumn]);
  };

  // Update a column
  const updateColumn = (updatedColumn: KanbanColumn) => {
    if (!updatedColumn || !updatedColumn.title.trim()) return;
    
    setColumns(columns.map(col => 
      col.id === updatedColumn.id ? { ...col, title: updatedColumn.title } : col
    ));
  };

  // Delete a column
  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter(col => col.id !== columnId));
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
    updateLeadNotes,
  };
};
