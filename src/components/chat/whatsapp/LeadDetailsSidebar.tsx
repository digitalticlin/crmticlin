
import { useState } from "react";
import { Contact, Deal } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, User, Phone, Mail, MapPin, Building, DollarSign, Plus, Calendar, TrendingUp, TrendingDown } from "lucide-react";
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
  const [newDeal, setNewDeal] = useState({
    status: 'won' as 'won' | 'lost',
    value: 0,
    note: ''
  });

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
          notes: updates.notes,
          purchase_value: updates.purchaseValue
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

  const handleAddDeal = async () => {
    if (!selectedContact.id || !newDeal.value) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('deals')
        .insert({
          lead_id: selectedContact.id,
          status: newDeal.status,
          value: newDeal.value,
          note: newDeal.note
        });

      if (error) throw error;

      // Refresh deals (in a real app, you'd update the contact's deals array)
      setNewDeal({ status: 'won', value: 0, note: '' });
      toast.success('Deal adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding deal:', error);
      toast.error('Erro ao adicionar deal');
    } finally {
      setIsLoading(false);
    }
  };

  const currentContact = { ...selectedContact, ...editedContact };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-[#0b141a] border-l border-[#313d45] z-50 transform transition-transform duration-300">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#313d45]">
          <h2 className="text-lg font-semibold text-[#e9edef]">Detalhes do Lead</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#e9edef] text-base">Informações Básicas</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-[#00a884] hover:text-[#00a884]/80"
                  >
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#8696a0] flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.name || currentContact.name}
                      onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
                      className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                    />
                  ) : (
                    <p className="text-[#e9edef]">{currentContact.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8696a0] flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <p className="text-[#e9edef]">{currentContact.phone}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8696a0] flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.email || currentContact.email || ''}
                      onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
                      className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <p className="text-[#e9edef]">{currentContact.email || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8696a0] flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Empresa
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.company || currentContact.company || ''}
                      onChange={(e) => setEditedContact({...editedContact, company: e.target.value})}
                      className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-[#e9edef]">{currentContact.company || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8696a0] flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </Label>
                  {isEditing ? (
                    <Input
                      value={editedContact.address || currentContact.address || ''}
                      onChange={(e) => setEditedContact({...editedContact, address: e.target.value})}
                      className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                      placeholder="Endereço completo"
                    />
                  ) : (
                    <p className="text-[#e9edef]">{currentContact.address || 'Não informado'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[#8696a0] flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor de Compra
                  </Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedContact.purchaseValue || currentContact.purchaseValue || ''}
                      onChange={(e) => setEditedContact({...editedContact, purchaseValue: parseFloat(e.target.value) || 0})}
                      className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="text-[#e9edef]">
                      {currentContact.purchaseValue ? 
                        `R$ ${currentContact.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                        'Não informado'
                      }
                    </p>
                  )}
                </div>

                {isEditing && (
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="w-full bg-[#00a884] hover:bg-[#008f72] text-white"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notas */}
            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#e9edef] text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedContact.notes || currentContact.notes || ''}
                  onChange={(e) => setEditedContact({...editedContact, notes: e.target.value})}
                  placeholder="Adicione suas anotações sobre este lead..."
                  className="bg-[#2a3942] border-[#313d45] text-[#e9edef] min-h-[100px]"
                  onBlur={handleSave}
                />
              </CardContent>
            </Card>

            {/* Histórico de Deals */}
            <Card className="bg-[#202c33] border-[#313d45]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#e9edef] text-base">Histórico de Vendas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de deals existentes */}
                <div className="space-y-2">
                  {currentContact.deals && currentContact.deals.length > 0 ? (
                    currentContact.deals.map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 bg-[#2a3942] rounded-lg">
                        <div className="flex items-center gap-3">
                          {deal.status === 'won' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-[#e9edef] font-medium">
                              R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[#8696a0] text-sm">{deal.note}</p>
                          </div>
                        </div>
                        <Badge variant={deal.status === 'won' ? 'default' : 'destructive'}>
                          {deal.status === 'won' ? 'Ganho' : 'Perdido'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#8696a0] text-center py-4">Nenhum histórico de vendas</p>
                  )}
                </div>

                <Separator className="bg-[#313d45]" />

                {/* Adicionar novo deal */}
                <div className="space-y-3">
                  <h4 className="text-[#e9edef] font-medium">Adicionar Venda</h4>
                  
                  <Select value={newDeal.status} onValueChange={(value: 'won' | 'lost') => setNewDeal({...newDeal, status: value})}>
                    <SelectTrigger className="bg-[#2a3942] border-[#313d45] text-[#e9edef]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="won">Venda Ganha</SelectItem>
                      <SelectItem value="lost">Venda Perdida</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="Valor (R$)"
                    value={newDeal.value || ''}
                    onChange={(e) => setNewDeal({...newDeal, value: parseFloat(e.target.value) || 0})}
                    className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                  />

                  <Input
                    placeholder="Observação (opcional)"
                    value={newDeal.note}
                    onChange={(e) => setNewDeal({...newDeal, note: e.target.value})}
                    className="bg-[#2a3942] border-[#313d45] text-[#e9edef]"
                  />

                  <Button 
                    onClick={handleAddDeal}
                    disabled={!newDeal.value || isLoading}
                    className="w-full bg-[#00a884] hover:bg-[#008f72] text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Venda
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
