import { useState } from "react";
import { Contact, Deal } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, User, Phone, Mail, MapPin, Building, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DealHistory } from "@/components/chat/DealHistory";
import { useLeadDeals } from "@/hooks/salesFunnel/useLeadDeals";

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

  const currentContact = { ...selectedContact, ...editedContact };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white/10 backdrop-blur-md border-l border-white/20 z-50 transform transition-transform duration-300 shadow-xl">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/20 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-gray-800">Detalhes do Lead</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-800 hover:bg-white/30 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informações Básicas
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.name || currentContact.name}
                      onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
                      className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{currentContact.name}</p>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <p className="text-gray-700 bg-gray-50/50 p-2 rounded-lg">{currentContact.phone}</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedContact.email || currentContact.email || ''}
                      onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
                      className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <p className="text-gray-700">{currentContact.email || 'Não informado'}</p>
                  )}
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Empresa
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.company || currentContact.company || ''}
                      onChange={(e) => setEditedContact({...editedContact, company: e.target.value})}
                      className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-gray-700">{currentContact.company || 'Não informado'}</p>
                  )}
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CPF/CNPJ
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.documentId || currentContact.documentId || ''}
                      onChange={(e) => setEditedContact({...editedContact, documentId: e.target.value})}
                      className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  ) : (
                    <p className="text-gray-700">{currentContact.documentId || 'Não informado'}</p>
                  )}
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.address || currentContact.address || ''}
                      onChange={(e) => setEditedContact({...editedContact, address: e.target.value})}
                      className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="Endereço completo"
                    />
                  ) : (
                    <p className="text-gray-700">{currentContact.address || 'Não informado'}</p>
                  )}
                </div>

                {isEditing && (
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-lg"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Notas</h3>
              <Textarea
                value={editedContact.notes || currentContact.notes || ''}
                onChange={(e) => setEditedContact({...editedContact, notes: e.target.value})}
                placeholder="Adicione suas anotações sobre este lead..."
                className="bg-white/70 border-white/30 focus:border-blue-400 focus:ring-blue-400/20 min-h-[120px] resize-none"
                onBlur={handleSave}
              />
            </div>

            {/* Histórico de Vendas */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Vendas</h3>
              <DealHistory deals={deals} />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
