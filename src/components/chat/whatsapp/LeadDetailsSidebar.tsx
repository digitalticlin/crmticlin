
import { useState, useEffect } from "react";
import { Contact } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadDeals } from "@/hooks/salesFunnel/useLeadDeals";
import { useLeadTags } from "@/hooks/salesFunnel/useLeadTags";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { BasicInfoSection } from "./sidebar/BasicInfoSection";
import { NotesSection } from "./sidebar/NotesSection";
import { SalesHistorySection } from "./sidebar/SalesHistorySection";
import { TagsSection } from "./sidebar/TagsSection";
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

  const { data: deals = [], refetch: refetchDeals } = useLeadDeals(selectedContact?.leadId);
  const { leadTags, availableTags, loading: loadingTags, addTag, removeTag, fetchTags } = useLeadTags(selectedContact?.leadId || '');

  // Reset edited contact when selectedContact changes
  useEffect(() => {
    if (selectedContact) {
      setEditedContact({});
      setIsEditing(false);
    }
  }, [selectedContact?.id]);

  if (!selectedContact || !isOpen) return null;

  // Função para atualizar informações básicas no banco
  const handleUpdateBasicInfo = async (field: string, value: string) => {
    if (!selectedContact.leadId) {
      toast.error('ID do lead não encontrado');
      return;
    }

    setIsLoading(true);
    try {
      // Mapear campos do Contact para campos do banco de dados
      const fieldMappings: Record<string, string> = {
        name: 'name',
        email: 'email',
        company: 'company',
        documentId: 'document_id',
        address: 'address'
      };

      const dbField = fieldMappings[field] || field;
      
      const { error } = await supabase
        .from('leads')
        .update({ [dbField]: value })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      // Atualizar estado local
      const updates = { [field]: value };
      onUpdateContact({ ...selectedContact, ...updates });
      
      toast.success('Informação atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating basic info:', error);
      toast.error('Erro ao atualizar informação');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar todas as alterações de uma vez
  const handleSave = async () => {
    if (!selectedContact.leadId || Object.keys(editedContact).length === 0) return;

    setIsLoading(true);
    try {
      // Mapear campos do Contact para campos do banco de dados
      const dbUpdates: Record<string, any> = {};
      
      if (editedContact.name !== undefined) dbUpdates.name = editedContact.name;
      if (editedContact.email !== undefined) dbUpdates.email = editedContact.email;
      if (editedContact.company !== undefined) dbUpdates.company = editedContact.company;
      if (editedContact.documentId !== undefined) dbUpdates.document_id = editedContact.documentId;
      if (editedContact.address !== undefined) dbUpdates.address = editedContact.address;
      if (editedContact.notes !== undefined) dbUpdates.notes = editedContact.notes;

      const { error } = await supabase
        .from('leads')
        .update(dbUpdates)
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      // Atualizar estado local
      onUpdateContact({ ...selectedContact, ...editedContact });
      setIsEditing(false);
      setEditedContact({});
      toast.success('Todas as alterações foram salvas!');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar valor de negociação
  const handleUpdatePurchaseValue = async (value: number | undefined) => {
    if (!selectedContact.leadId) {
      toast.error('ID do lead não encontrado');
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ purchase_value: value })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      // Atualizar estado local
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

  // Função para atualizar notas
  const handleUpdateNotes = async (notes: string) => {
    if (!selectedContact.leadId) {
      toast.error('ID do lead não encontrado');
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      // Atualizar estado local
      onUpdateContact({ 
        ...selectedContact, 
        notes 
      });

      toast.success('Notas atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Erro ao atualizar notas');
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white/20 backdrop-blur-md border-l border-white/30 z-50 transform transition-transform duration-300 shadow-xl">
      <div className="h-full flex flex-col">
        <SidebarHeader onClose={onClose} />

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            <BasicInfoSection
              selectedContact={selectedContact}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedContact={editedContact}
              setEditedContact={setEditedContact}
              onSave={handleSave}
              isLoading={isLoading}
              onUpdateBasicInfo={handleUpdateBasicInfo}
            />

            <TagsSection
              leadTags={leadTags}
              availableTags={availableTags}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onTagsChange={fetchTags}
              isLoading={loadingTags}
            />

            <PurchaseValueField
              purchaseValue={selectedContact.purchaseValue}
              onUpdatePurchaseValue={handleUpdatePurchaseValue}
            />

            <NotesSection
              selectedContact={selectedContact}
              editedContact={editedContact}
              setEditedContact={setEditedContact}
              onSave={handleUpdateNotes}
              onUpdateNotes={handleUpdateNotes}
            />

            <SalesHistorySection deals={deals} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
