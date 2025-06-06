
import { useState } from "react";
import { Contact } from "@/types/chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadDeals } from "@/hooks/salesFunnel/useLeadDeals";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassmorphismLeadHeader } from "@/components/sales/leadDetail/GlassmorphismLeadHeader";
import { GlassmorphismBasicInfo } from "@/components/sales/leadDetail/GlassmorphismBasicInfo";
import { GlassmorphismPurchaseValue } from "@/components/sales/leadDetail/GlassmorphismPurchaseValue";
import { GlassmorphismAssignedUser } from "@/components/sales/leadDetail/GlassmorphismAssignedUser";
import { GlassmorphismNotes } from "@/components/sales/leadDetail/GlassmorphismNotes";
import { GlassmorphismDealHistory } from "@/components/sales/leadDetail/GlassmorphismDealHistory";
import { KanbanLead } from "@/types/kanban";

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
  const [isLoading, setIsLoading] = useState(false);

  const { data: deals = [] } = useLeadDeals(selectedContact?.id);

  if (!selectedContact || !isOpen) return null;

  // Convert Contact to KanbanLead for glassmorphism components
  const kanbanLead: KanbanLead = {
    id: selectedContact.id,
    name: selectedContact.name,
    phone: selectedContact.phone,
    email: selectedContact.email,
    company: selectedContact.company,
    documentId: selectedContact.documentId,
    address: selectedContact.address,
    notes: selectedContact.notes,
    tags: (selectedContact.tags || []).map(tag => ({
      id: tag,
      name: tag,
      color: '#10B981' // Default green color for tags
    })),
    lastMessage: selectedContact.lastMessage,
    lastMessageTime: selectedContact.lastMessageTime,
    purchaseValue: selectedContact.purchaseValue,
    assignedUser: selectedContact.assignedUser,
    columnId: '',
    unreadCount: selectedContact.unreadCount,
    avatar: selectedContact.avatar
  };

  const handleNameUpdate = async (name: string) => {
    if (!selectedContact.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ name })
        .eq('id', selectedContact.id);

      if (error) throw error;

      onUpdateContact({ name });
      toast.success('Nome do lead atualizado');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Erro ao atualizar nome');
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

      onUpdateContact({ purchaseValue: value });
      toast.success('Valor de negociação atualizado!');
    } catch (error) {
      console.error('Error updating purchase value:', error);
      toast.error('Erro ao atualizar valor de negociação');
    }
  };

  const handleUpdateAssignedUser = async (user: string) => {
    if (!selectedContact.id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ owner_id: user })
        .eq('id', selectedContact.id);

      if (error) throw error;

      onUpdateContact({ assignedUser: user });
      toast.success('Responsável atualizado');
    } catch (error) {
      console.error('Error updating assigned user:', error);
      toast.error('Erro ao atualizar responsável');
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedContact.id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', selectedContact.id);

      if (error) throw error;

      onUpdateContact({ notes });
      toast.success('Observações atualizadas');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Erro ao atualizar observações');
    }
  };

  const handleUpdateLead = async (updates: Partial<KanbanLead>) => {
    if (!selectedContact.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: updates.name,
          email: updates.email,
          company: updates.company,
          document_id: updates.documentId,
          address: updates.address
        })
        .eq('id', selectedContact.id);

      if (error) throw error;

      // Convert KanbanLead updates back to Contact format
      const contactUpdates: Partial<Contact> = {
        name: updates.name,
        email: updates.email,
        company: updates.company,
        documentId: updates.documentId,
        address: updates.address
      };

      onUpdateContact(contactUpdates);
      toast.success('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-2xl border-l border-lime-400/30 shadow-2xl z-50 transform transition-transform duration-300">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-yellow-300/5 to-lime-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-lime-400/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Detalhes do Lead</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Lead Header with Avatar - Compact */}
            <div className="relative bg-gradient-to-br from-lime-400/30 via-yellow-300/20 to-lime-500/30 backdrop-blur-xl rounded-xl p-4 border-2 border-lime-400/40 shadow-xl shadow-lime-400/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-lime-400/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-300/20 rounded-full blur-xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-lime-400/80 to-yellow-300/80 flex items-center justify-center text-black font-bold text-lg ring-2 ring-lime-400/60">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-bold text-white drop-shadow-lg">
                      {selectedContact.name}
                    </h2>
                    <div className="flex items-center gap-2 text-lime-200/90 text-sm">
                      <span>{selectedContact.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/15 backdrop-blur-sm rounded-full px-2 py-1 border border-lime-400/30">
                  <span className="text-xs text-lime-300 font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Info Section - Compact */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-lime-400/30 shadow-lg shadow-lime-400/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-lg shadow-lg shadow-lime-400/30">
                  <div className="h-3 w-3 bg-black rounded-sm" />
                </div>
                Informações Básicas
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <p className="text-white/70 text-xs">Email</p>
                  <p className="text-white">{selectedContact.email || 'Não informado'}</p>
                </div>
                
                {selectedContact.company && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                    <p className="text-white/70 text-xs">Empresa</p>
                    <p className="text-white">{selectedContact.company}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Purchase Value Field - Compact */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-lime-400/30 shadow-lg shadow-lime-400/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-lg shadow-lg shadow-lime-400/30">
                  <div className="h-3 w-3 bg-black rounded-sm" />
                </div>
                Valor da Negociação
              </h3>
              
              <div className="bg-gradient-to-br from-lime-500/20 to-green-500/20 backdrop-blur-sm rounded-lg p-3 border border-lime-400/40">
                <div className="text-xl font-bold text-lime-300 drop-shadow-lg">
                  {selectedContact.purchaseValue ? 
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(selectedContact.purchaseValue) : 
                    'R$ 0,00'
                  }
                </div>
              </div>
            </div>
            
            {/* Assigned User Field - Compact */}
            {selectedContact.assignedUser && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-lime-400/30 shadow-lg shadow-lime-400/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-lg shadow-lg shadow-lime-400/30">
                    <div className="h-3 w-3 bg-black rounded-sm" />
                  </div>
                  Responsável
                </h3>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <p className="text-white text-sm">{selectedContact.assignedUser}</p>
                </div>
              </div>
            )}
            
            {/* Notes Field - Compact */}
            {selectedContact.notes && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-lime-400/30 shadow-lg shadow-lime-400/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-lg shadow-lg shadow-lime-400/30">
                    <div className="h-3 w-3 bg-black rounded-sm" />
                  </div>
                  Observações
                </h3>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedContact.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Deal History - Compact */}
            {deals.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-lime-400/30 shadow-lg shadow-lime-400/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gradient-to-br from-lime-400/80 to-yellow-300/80 rounded-lg shadow-lg shadow-lime-400/30">
                    <div className="h-3 w-3 bg-black rounded-sm" />
                  </div>
                  Histórico de Negociações
                </h3>
                <GlassmorphismDealHistory deals={deals} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
