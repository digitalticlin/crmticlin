
import { useState } from "react";
import { Contact, Deal } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, User, Phone, Mail, MapPin, Building, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    <div className="fixed right-0 top-0 bottom-0 w-96 z-50 transform transition-transform duration-300 shadow-xl overflow-hidden">
      {/* Background complexo com gradientes radiais */}
      <div className="absolute inset-0 bg-gradient-radial from-[#D3D800]/20 via-[#17191c]/80 to-[#0a0b0d] backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#D3D800]/10 via-transparent to-[#17191c]/60"></div>
      
      {/* Elementos flutuantes para profundidade */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-[#D3D800]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-[#D3D800]/15 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header com gradiente */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#D3D800] via-yellow-400 to-[#D3D800] bg-clip-text text-transparent">
            Detalhes do Lead
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-105"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/20 transition-all duration-300 hover:bg-white/15">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-[#D3D800] to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
                  <User className="h-5 w-5 text-[#D3D800]" />
                  Informações Básicas
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-[#D3D800] hover:text-yellow-300 hover:bg-[#D3D800]/20 rounded-lg backdrop-blur-lg border border-[#D3D800]/30 transition-all duration-300 hover:scale-105"
                >
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label className="text-white/90 font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-[#D3D800]" />
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.name || currentContact.name}
                      onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#D3D800] focus:ring-[#D3D800]/20 backdrop-blur-lg"
                    />
                  ) : (
                    <p className="text-white font-medium">{currentContact.name}</p>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label className="text-white/90 font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#D3D800]" />
                    Telefone
                  </Label>
                  <p className="text-white/80 bg-white/5 p-2 rounded-lg border border-white/10">{currentContact.phone}</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-white/90 font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#D3D800]" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedContact.email || currentContact.email || ''}
                      onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#D3D800] focus:ring-[#D3D800]/20 backdrop-blur-lg"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <p className="text-white/80">{currentContact.email || 'Não informado'}</p>
                  )}
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label className="text-white/90 font-medium flex items-center gap-2">
                    <Building className="h-4 w-4 text-[#D3D800]" />
                    Empresa
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.company || currentContact.company || ''}
                      onChange={(e) => setEditedContact({...editedContact, company: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#D3D800] focus:ring-[#D3D800]/20 backdrop-blur-lg"
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-white/80">{currentContact.company || 'Não informado'}</p>
                  )}
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-2">
                  <Label className="text-white/90 font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#D3D800]" />
                    CPF/CNPJ
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.documentId || currentContact.documentId || ''}
                      onChange={(e) => setEditedContact({...editedContact, documentId: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#D3D800] focus:ring-[#D3D800]/20 backdrop-blur-lg"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  ) : (
                    <p className="text-white/80">{currentContact.documentId || 'Não informado'}</p>
                  )}
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <Label className="text-white/90 font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#D3D800]" />
                    Endereço
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.address || currentContact.address || ''}
                      onChange={(e) => setEditedContact({...editedContact, address: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#D3D800] focus:ring-[#D3D800]/20 backdrop-blur-lg"
                      placeholder="Endereço completo"
                    />
                  ) : (
                    <p className="text-white/80">{currentContact.address || 'Não informado'}</p>
                  )}
                </div>

                {isEditing && (
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#D3D800] to-yellow-400 hover:from-yellow-400 hover:to-[#D3D800] text-black font-medium shadow-lg rounded-lg transition-all duration-300 hover:scale-105 backdrop-blur-lg"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </div>
            </div>

            {/* Separador com gradiente */}
            <Separator className="bg-gradient-to-r from-transparent via-[#D3D800]/50 to-transparent h-[2px]" />

            {/* Notas */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/20 transition-all duration-300 hover:bg-white/15">
              <h3 className="text-lg font-bold bg-gradient-to-r from-[#D3D800] to-yellow-400 bg-clip-text text-transparent mb-4">
                Notas
              </h3>
              <Textarea
                value={editedContact.notes || currentContact.notes || ''}
                onChange={(e) => setEditedContact({...editedContact, notes: e.target.value})}
                placeholder="Adicione suas anotações sobre este lead..."
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-[#D3D800] focus:ring-[#D3D800]/20 min-h-[120px] resize-none backdrop-blur-lg"
                onBlur={handleSave}
              />
            </div>

            {/* Separador com gradiente */}
            <Separator className="bg-gradient-to-r from-transparent via-[#D3D800]/50 to-transparent h-[2px]" />

            {/* Histórico de Vendas */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/20 transition-all duration-300 hover:bg-white/15">
              <h3 className="text-lg font-bold bg-gradient-to-r from-[#D3D800] to-yellow-400 bg-clip-text text-transparent mb-4">
                Histórico de Vendas
              </h3>
              
              <div className="space-y-3">
                {currentContact.deals && currentContact.deals.length > 0 ? (
                  currentContact.deals.map((deal) => (
                    <div 
                      key={deal.id} 
                      className="p-4 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {deal.status === 'won' ? (
                            <div className="p-2 rounded-full bg-green-500/20 border border-green-500/30">
                              <TrendingUp className="h-5 w-5 text-green-400" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-full bg-red-500/20 border border-red-500/30">
                              <TrendingDown className="h-5 w-5 text-red-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-semibold text-lg">
                              R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-white/70 text-sm">
                              {new Date(deal.date).toLocaleDateString('pt-BR')}
                            </p>
                            {deal.note && (
                              <p className="text-white/60 text-sm mt-1">{deal.note}</p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={deal.status === 'won' ? 'default' : 'destructive'}
                          className={`rounded-full shadow-sm backdrop-blur-lg ${
                            deal.status === 'won' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {deal.status === 'won' ? 'Ganho' : 'Perdido'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <TrendingUp className="h-8 w-8 text-white/40" />
                    </div>
                    <p className="text-white/60 text-sm">Nenhum histórico de vendas encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
