
import { useState, useEffect } from "react";
import { ClientData } from "@/hooks/clients/types";
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { clientToLeadAdapter } from "@/utils/clientToLeadAdapter";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { useLeadDeals } from "@/hooks/salesFunnel/useLeadDeals";

interface UniversalLeadDetailSidebarProps {
  // Aceita tanto Client quanto Lead
  data: ClientData | KanbanLead;
  dataType: 'client' | 'lead';
  
  // Controle de estado
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Callbacks para client
  onUpdateClient?: (updates: Partial<ClientData>) => void;
  
  // Callbacks para lead (mantidos para compatibilidade)
  availableTags?: KanbanTag[];
  onToggleTag?: (tagId: string) => void;
  onCreateTag?: (name: string, color: string) => void;
  
  // Callbacks universais
  onUpdateNotes?: (notes: string) => void;
  onUpdatePurchaseValue?: (value: number | undefined) => void;
  onUpdateAssignedUser?: (user: string) => void;
  onUpdateName?: (name: string) => void;
}

export const UniversalLeadDetailSidebar = ({
  data,
  dataType,
  isOpen,
  onOpenChange,
  onUpdateClient,
  availableTags = [],
  onToggleTag = () => {},
  onCreateTag,
  onUpdateNotes,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onUpdateName
}: UniversalLeadDetailSidebarProps) => {
  const [adaptedLead, setAdaptedLead] = useState<KanbanLead | null>(null);

  useEffect(() => {
    if (dataType === 'client') {
      const converted = clientToLeadAdapter(data as ClientData);
      setAdaptedLead(converted);
    } else {
      setAdaptedLead(data as KanbanLead);
    }
  }, [data, dataType]);

  // Wrapper para updates quando é client
  const handleUpdateNotes = (notes: string) => {
    if (onUpdateNotes) {
      onUpdateNotes(notes);
    }
    if (dataType === 'client' && onUpdateClient) {
      onUpdateClient({ notes });
    }
  };

  const handleUpdatePurchaseValue = (value: number | undefined) => {
    if (onUpdatePurchaseValue) {
      onUpdatePurchaseValue(value);
    }
    if (dataType === 'client' && onUpdateClient) {
      onUpdateClient({ purchase_value: value });
    }
  };

  const handleUpdateName = (name: string) => {
    if (onUpdateName) {
      onUpdateName(name);
    }
    if (dataType === 'client' && onUpdateClient) {
      onUpdateClient({ name });
    }
  };

  const handleUpdateAssignedUser = (user: string) => {
    if (onUpdateAssignedUser) {
      onUpdateAssignedUser(user);
    }
    // Para clients, isso pode ser expandido no futuro
  };

  if (!adaptedLead) return null;

  return (
    <LeadDetailSidebar
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      selectedLead={adaptedLead}
      availableTags={availableTags}
      onToggleTag={onToggleTag}
      onUpdateNotes={handleUpdateNotes}
      onUpdatePurchaseValue={handleUpdatePurchaseValue}
      onUpdateAssignedUser={handleUpdateAssignedUser}
      onUpdateName={handleUpdateName}
      onCreateTag={onCreateTag}
    />
  );
};
