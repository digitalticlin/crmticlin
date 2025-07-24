
import { useState, useEffect, useCallback } from "react";
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
import { AssignedUserSection } from "./sidebar/AssignedUserSection";

interface LeadDetailsSidebarProps {
  selectedContact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContact: (contact: Contact) => void;
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
  const [localContact, setLocalContact] = useState<Contact>(selectedContact);

  const { data: deals = [], refetch: refetchDeals } = useLeadDeals(selectedContact?.leadId);

  // ✅ NOVO: Atualizar estado local quando selectedContact muda
  useEffect(() => {
    if (selectedContact) {
      setLocalContact(selectedContact);
      setEditedContact({});
      setIsEditing(false);
    }
  }, [selectedContact?.id]);

  // ✅ CORREÇÃO: Função estável para atualizar contato local
  const updateLocalContact = useCallback((updatedLead: any) => {
    console.log('[LeadDetailsSidebar] 🔄 Atualizando contato local via realtime:', updatedLead);
    
    setLocalContact(prevContact => {
      const updatedLocalContact: Contact = {
        ...prevContact,
        name: updatedLead.name || prevContact.name,
        email: updatedLead.email || prevContact.email,
        company: updatedLead.company || prevContact.company,
        documentId: updatedLead.document_id || prevContact.documentId,
        address: updatedLead.address || prevContact.address,
        notes: updatedLead.notes || prevContact.notes,
        purchaseValue: updatedLead.purchase_value || prevContact.purchaseValue,
        assignedUser: updatedLead.owner_id || prevContact.assignedUser
      };
      
      // Disparar atualização para o componente pai
      onUpdateContact(updatedLocalContact);
      
      return updatedLocalContact;
    });
  }, [onUpdateContact]);

  // ✅ CORREÇÃO: Subscription em tempo real SEM dependências problemáticas
  useEffect(() => {
    if (!selectedContact?.leadId) return;

    console.log('[LeadDetailsSidebar] 📡 Configurando realtime para lead:', selectedContact.leadId);

    const channel = supabase
      .channel(`lead-realtime-${selectedContact.leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `id=eq.${selectedContact.leadId}`
        },
        (payload) => {
          updateLocalContact(payload.new);
        }
      )
      .subscribe();

    return () => {
      console.log('[LeadDetailsSidebar] 🔌 Removendo subscription realtime');
      supabase.removeChannel(channel);
    };
  }, [selectedContact?.leadId, updateLocalContact]); // ✅ CORREÇÃO: Apenas leadId e função estável

  if (!selectedContact || !isOpen) return null;

  // ✅ CORREÇÃO: Verificar leadId antes de todas as operações
  const validateLeadId = () => {
    if (!selectedContact.leadId) {
      toast.error('ID do lead não encontrado - Impossível editar');
      return false;
    }
    return true;
  };

  // ✅ CORREÇÃO: Atualização genérica para campos básicos com atualização local imediata
  const handleUpdateBasicInfo = async (field: string, value: string) => {
    if (!validateLeadId()) return;

    // ✅ OTIMISTIC UPDATE: Atualizar UI imediatamente
    const updatedLocalContact = {
      ...localContact,
      [field === 'document_id' ? 'documentId' : field]: value
    };
    
    setLocalContact(updatedLocalContact);

    // ✅ PROPAGAR: Disparar evento para lista e header se for nome
    if (field === 'name') {
      window.dispatchEvent(new CustomEvent('contactNameUpdated', {
        detail: {
          leadId: selectedContact.leadId,
          contactId: selectedContact.id,
          newName: value,
          oldName: localContact.name
        }
      }));
      
      console.log('[LeadDetailsSidebar] 📡 Evento de nome atualizado disparado');
    }

    // ✅ PROPAGAR: Atualização completa para o componente pai
    onUpdateContact(updatedLocalContact);

    setIsLoading(true);

    try {
      console.log('[LeadDetailsSidebar] 📝 Atualizando campo:', { field, value, leadId: selectedContact.leadId });

      const { error } = await supabase
        .from('leads')
        .update({ [field]: value })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      toast.success(`${field} atualizado com sucesso!`);

    } catch (error: any) {
      console.error(`[LeadDetailsSidebar] ❌ Erro ao atualizar ${field}:`, error);
      toast.error(`Erro ao atualizar ${field}`);
      
      // ✅ ROLLBACK: Reverter se erro
      setLocalContact(selectedContact);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePurchaseValue = async (value: number | null) => {
    if (!validateLeadId()) return;

    // ✅ OTIMISTIC UPDATE
    setLocalContact(prev => ({ ...prev, purchaseValue: value }));

    setIsLoading(true);

    try {
      console.log('[LeadDetailsSidebar] 💰 Atualizando valor de compra:', { value, leadId: selectedContact.leadId });

      const { error } = await supabase
        .from('leads')
        .update({ purchase_value: value })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      toast.success('Valor de compra atualizado!');

    } catch (error: any) {
      console.error('[LeadDetailsSidebar] ❌ Erro ao atualizar valor de compra:', error);
      toast.error('Erro ao atualizar valor de compra');
      
      // ✅ ROLLBACK
      setLocalContact(prev => ({ ...prev, purchaseValue: selectedContact.purchaseValue }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAssignedUser = async (userId: string) => {
    if (!validateLeadId()) return;

    // ✅ OTIMISTIC UPDATE
    setLocalContact(prev => ({ ...prev, assignedUser: userId }));

    setIsLoading(true);

    try {
      console.log('[LeadDetailsSidebar] 👤 Atualizando usuário responsável:', { userId, leadId: selectedContact.leadId });

      const { error } = await supabase
        .from('leads')
        .update({ owner_id: userId })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      toast.success('Usuário responsável atualizado!');

    } catch (error: any) {
      console.error('[LeadDetailsSidebar] ❌ Erro ao atualizar usuário responsável:', error);
      toast.error('Erro ao atualizar usuário responsável');
      
      // ✅ ROLLBACK
      setLocalContact(prev => ({ ...prev, assignedUser: selectedContact.assignedUser }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!validateLeadId()) return;

    // ✅ OTIMISTIC UPDATE
    setLocalContact(prev => ({ ...prev, notes }));

    setIsLoading(true);

    try {
      console.log('[LeadDetailsSidebar] 📋 Atualizando observações:', { notes: notes.substring(0, 50), leadId: selectedContact.leadId });

      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      toast.success('Observações atualizadas!');

    } catch (error: any) {
      console.error('[LeadDetailsSidebar] ❌ Erro ao atualizar observações:', error);
      toast.error('Erro ao atualizar observações');
      
      // ✅ ROLLBACK
      setLocalContact(prev => ({ ...prev, notes: selectedContact.notes }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateLeadId()) return;

    setIsLoading(true);

    try {
      console.log('[LeadDetailsSidebar] 💾 Salvando edições em lote:', editedContact);

      const updateData = Object.keys(editedContact).reduce((acc, key) => {
        const value = editedContact[key as keyof Contact];
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      if (Object.keys(updateData).length === 0) {
        toast.info('Nenhuma alteração para salvar');
        setIsEditing(false);
        return;
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', selectedContact.leadId);

      if (error) throw error;

      setEditedContact({});
      setIsEditing(false);
      toast.success('Alterações salvas com sucesso!');

    } catch (error: any) {
      console.error('[LeadDetailsSidebar] ❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ USAR localContact em vez de selectedContact para mostrar dados atualizados
  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white/20 backdrop-blur-md border-l border-white/30 z-50 transform transition-transform duration-300 shadow-xl">
      <div className="h-full flex flex-col">
        <SidebarHeader onClose={onClose} />

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            <BasicInfoSection
              selectedContact={localContact}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedContact={editedContact}
              setEditedContact={setEditedContact}
              onSave={handleSave}
              isLoading={isLoading}
              onUpdateBasicInfo={handleUpdateBasicInfo}
            />

            <PurchaseValueField
              purchaseValue={localContact.purchaseValue}
              onUpdatePurchaseValue={handleUpdatePurchaseValue}
            />

            {/* ✅ FOCO: Apenas Usuário Responsável para gestão da equipe */}
            <AssignedUserSection
              assignedUser={localContact.assignedUser}
              onUpdateAssignedUser={handleUpdateAssignedUser}
              isLoading={isLoading}
            />

            <NotesSection
              selectedContact={localContact}
              editedContact={editedContact}
              setEditedContact={setEditedContact}
              onUpdateNotes={handleUpdateNotes}
            />

            <SalesHistorySection deals={deals} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
