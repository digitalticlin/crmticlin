
import { useState } from "react";
import { Contact } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadDeals } from "@/hooks/salesFunnel/useLeadDeals";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { BasicInfoSection } from "./sidebar/BasicInfoSection";
import { NotesSection } from "./sidebar/NotesSection";
import { SalesHistorySection } from "./sidebar/SalesHistorySection";
import { PurchaseValueField } from "@/components/sales/leadDetail/PurchaseValueField";

interface LeadDetailsSidebarProps {
  selectedContact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContact: (updates: Partial<Contact>) => void;
}

export const LeadDetailsSidebar = ({
  selectedContact,
  isOpen,
  onClose,
  onUpdateContact
}: LeadDetailsSidebarProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { data: deals = [] } = useLeadDeals(selectedContact?.id);

  if (!selectedContact || !isOpen) return null;

  const handleSave = async () => {
    if (!selectedContact.id) return;

    setIsLoading(true);
    try {
      const updates = {
        ...editedContact,
        id: selectedContact.id
      };

      const { error } = await supabase
        .from('leads')
        .update({
          name: updates.name,
          email: updates.email,
          address: updates.address,
          company: updates.company,
          document_id: updates.documentId,
          notes: updates.notes
        })
        .eq('id', selectedContact.id);

      if (error) throw error;

      onUpdateContact(updates);
      setIsEditing(false);
      setEditedContact({});
      toast.success('Contato atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Erro ao atualizar contato');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePurchaseValue = async (value: number | undefined) => {
    if (!selectedContact.id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ purchase_value: value })
        .eq('id', selectedContact.id);

      if (error) throw error;

      // Update local contact data
      onUpdateContact({ 
        ...selectedContact, 
        purchaseValue: value 
      });

      toast.success('Valor de negociação atualizado!');
    } catch (error) {
      console.error('Error updating purchase value:', error);
      toast.error('Erro ao atualizar valor de negociação');
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white/10 backdrop-blur-md border-l border-white/20 z-50 transform transition-transform duration-300 shadow-xl">
      <div className="h-full flex flex-col">
        <SidebarHeader onClose={onClose} />

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <BasicInfoSection
              selectedContact={selectedContact}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedContact={editedContact}
              setEditedContact={setEditedContact}
              onSave={handleSave}
              isLoading={isLoading}
            />

            <PurchaseValueField
              purchaseValue={selectedContact.purchaseValue}
              onUpdatePurchaseValue={handleUpdatePurchaseValue}
            />

            <NotesSection
              selectedContact={selectedContact}
              editedContact={editedContact}
              setEditedContact={setEditedContact}
              onSave={handleSave}
            />

            <SalesHistorySection deals={deals} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
