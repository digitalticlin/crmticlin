import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, User, Building2, Mail, DollarSign, Calendar, Tag, Phone, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact, CurrentDeal, DealHistoryItem } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SalesHistorySection } from "./sidebar/SalesHistorySection";
import { AddressSection } from "./sections/AddressSection";
import { CurrentDealSection } from "./sections/CurrentDealSection";
import { DealHistorySection } from "./sections/DealHistorySection";

interface LeadDetailsSidebarProps {
  selectedContact: Contact | null;
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
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    purchaseValue: "",
    notes: ""
  });

  useEffect(() => {
    if (selectedContact) {
      console.log('[LeadDetailsSidebar] 🔄 Carregando dados do contato selecionado:', {
        contactId: selectedContact.id,
        name: selectedContact.name,
        email: selectedContact.email,
        company: selectedContact.company,
        purchaseValue: selectedContact.purchaseValue,
        notes: selectedContact.notes
      });
      
      setFormData({
        name: selectedContact.name || "",
        email: selectedContact.email || "",
        company: selectedContact.company || "",
        purchaseValue: selectedContact.purchaseValue ? selectedContact.purchaseValue.toString() : "",
        notes: selectedContact.notes || ""
      });
    }
  }, [selectedContact]);

  // Listener para recarregar dados quando o contato for atualizado externamente
  useEffect(() => {
    const handleContactUpdate = async (event: CustomEvent) => {
      const { leadId, updatedContact } = event.detail || {};
      
      if (leadId === selectedContact?.id && !isEditing) {
        console.log('[LeadDetailsSidebar] 🔄 Contato atualizado externamente, recarregando dados');
        
        // Buscar dados mais recentes do banco
        try {
          const { data: freshData, error } = await supabase
            .from('leads')
            .select('id, name, email, company, purchase_value, notes')
            .eq('id', leadId)
            .single();
          
          if (!error && freshData) {
            console.log('[LeadDetailsSidebar] 🔄 Dados frescos carregados:', freshData);
            setFormData({
              name: freshData.name || "",
              email: freshData.email || "",
              company: freshData.company || "",
              purchaseValue: freshData.purchase_value ? freshData.purchase_value.toString() : "",
              notes: freshData.notes || ""
            });
          }
        } catch (error) {
          console.error('[LeadDetailsSidebar] ❌ Erro ao recarregar dados frescos:', error);
        }
      }
    };

    window.addEventListener('leadUpdated', handleContactUpdate);
    return () => {
      window.removeEventListener('leadUpdated', handleContactUpdate);
    };
  }, [selectedContact?.id, isEditing]);

  const handleSave = useCallback(async () => {
    if (!selectedContact) return;

    setIsSaving(true);
    try {
      const { name, email, company, purchaseValue, notes } = formData;

      console.log('[LeadDetailsSidebar] 💾 Salvando informações do lead:', {
        leadId: selectedContact.id,
        originalData: {
          name: selectedContact.name,
          email: selectedContact.email,
          company: selectedContact.company,
          purchaseValue: selectedContact.purchaseValue,
          notes: selectedContact.notes
        },
        newData: { name, email, company, purchaseValue, notes }
      });

      // Verificar se o lead existe primeiro
      const { data: existingLead, error: fetchError } = await supabase
        .from('leads')
        .select('id, name, email, company, purchase_value, notes')
        .eq('id', selectedContact.id)
        .single();

      if (fetchError) {
        console.error('[LeadDetailsSidebar] ❌ Lead não encontrado:', fetchError);
        toast.error("Lead não encontrado no banco de dados.");
        return;
      }

      console.log('[LeadDetailsSidebar] 🔍 Lead existente encontrado:', existingLead);

      // Atualizar o lead
      const { data, error } = await supabase
        .from('leads')
        .update({
          name: name || null,
          email: email || null,
          company: company || null,
          purchase_value: purchaseValue ? parseFloat(purchaseValue) : null,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContact.id)
        .select('*')
        .single();

      if (error) {
        console.error("[LeadDetailsSidebar] ❌ Erro ao atualizar lead:", error);
        toast.error("Erro ao salvar as informações do lead: " + error.message);
        return;
      }

      console.log('[LeadDetailsSidebar] ✅ Lead atualizado com sucesso:', data);

      // Verificar se os dados foram realmente persistidos
      const { data: verificationData, error: verificationError } = await supabase
        .from('leads')
        .select('id, name, email, company, purchase_value, notes, updated_at')
        .eq('id', selectedContact.id)
        .single();

      if (verificationError) {
        console.error('[LeadDetailsSidebar] ❌ Erro na verificação:', verificationError);
      } else {
        console.log('[LeadDetailsSidebar] ✅ Verificação de persistência:', verificationData);
      }

      const updatedContact: Contact = {
        ...selectedContact,
        name: data.name,
        email: data.email,
        company: data.company,
        purchaseValue: data.purchase_value,
        notes: data.notes
      };

      // Atualizar o contato no contexto
      onUpdateContact(updatedContact);
      
      // Disparar evento para forçar refresh completo dos contatos
      window.dispatchEvent(new CustomEvent('leadUpdated', {
        detail: {
          leadId: selectedContact.id,
          updatedContact,
          forceRefresh: true
        }
      }));

      // Disparar evento específico para atualização de nome
      if (data.name !== selectedContact.name) {
        window.dispatchEvent(new CustomEvent('contactNameUpdated', {
          detail: {
            leadId: selectedContact.id,
            contactId: selectedContact.id,
            newName: data.name
          }
        }));
      }
      
      setIsEditing(false);
      toast.success("Informações do lead salvas e persistidas com sucesso!");
      
      console.log('[LeadDetailsSidebar] 📡 Eventos de atualização disparados');
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast.error("Erro ao salvar as informações do lead: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [selectedContact, formData, onUpdateContact]);

  const handleEditToggle = () => {
    setIsEditing(prev => !prev);
  };

  if (!selectedContact || !isOpen) {
    return null;
  }

  const displayName = selectedContact.name || formatPhoneDisplay(selectedContact.phone);

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden z-40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-80 bg-white/15 backdrop-blur-md border-l border-white/30 shadow-2xl transform transition-transform duration-300 ease-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <SidebarHeader onClose={onClose} />
          
          <div className="flex-1 overflow-y-auto glass-scrollbar p-6 space-y-6">
            {/* Informações básicas do contato */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800">👤 Informações do Lead</h3>
                </div>
                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleEditToggle}
                    className="text-gray-600 hover:text-gray-800 hover:bg-white/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                      placeholder="Nome do lead"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{displayName}</p>
                  )}
                </div>

                {/* Telefone (sempre readonly) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                  <p className="text-gray-800 mt-1 font-mono text-sm bg-white/30 px-3 py-2 rounded-md">
                    {formatPhoneDisplay(selectedContact.phone)}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{selectedContact.email || "Não informado"}</p>
                  )}
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">Empresa</Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">{selectedContact.company || "Não informado"}</p>
                  )}
                </div>

                {/* Valor de compra */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseValue" className="text-sm font-medium text-gray-700">Valor de Compra</Label>
                  {isEditing ? (
                    <Input
                      id="purchaseValue"
                      type="number"
                      step="0.01"
                      value={formData.purchaseValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseValue: e.target.value }))}
                      className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="text-gray-800 mt-1">
                      {selectedContact.purchaseValue 
                        ? `R$ ${Number(selectedContact.purchaseValue).toFixed(2)}` 
                        : "Não informado"
                      }
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Observações</Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400 min-h-[80px]"
                      placeholder="Observações sobre o lead..."
                    />
                  ) : (
                    <p className="text-gray-800 mt-1 text-sm">
                      {selectedContact.notes || "Nenhuma observação"}
                    </p>
                  )}
                </div>

                {/* Botões de ação */}
                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-white/30">
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/30"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>


            {/* Endereço Completo */}
            <AddressSection 
              contact={selectedContact}
              onUpdateAddress={async (addressData) => {
                try {
                  const { error } = await supabase
                    .from('leads')
                    .update({
                      address: addressData.address,
                      bairro: addressData.bairro,
                      cidade: addressData.cidade,
                      estado: addressData.estado,
                      pais: addressData.pais,
                      cep: addressData.cep,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedContact.id);

                  if (error) throw error;

                  onUpdateContact({
                    ...selectedContact,
                    address: addressData.address,
                    bairro: addressData.bairro,
                    cidade: addressData.cidade,
                    estado: addressData.estado,
                    pais: addressData.pais,
                    cep: addressData.cep
                  });

                  toast.success("Endereço atualizado com sucesso!");
                } catch (error) {
                  console.error("Erro ao atualizar endereço:", error);
                  toast.error("Erro ao atualizar endereço");
                  throw error;
                }
              }}
            />

            {/* Negociação Atual */}
            <CurrentDealSection 
              currentDeal={selectedContact.currentDeal}
              onUpdateDeal={async (deal: CurrentDeal) => {
                try {
                  // Buscar deal ativo existente
                  const { data: existingDeal } = await supabase
                    .from('deals')
                    .select('id')
                    .eq('lead_id', selectedContact.id)
                    .in('status', ['active', 'pending', 'negotiating'])
                    .single();

                  if (existingDeal) {
                    // Atualizar deal existente
                    const { error } = await supabase
                      .from('deals')
                      .update({
                        value: deal.value,
                        status: deal.status,
                        note: deal.notes,
                        date: new Date().toISOString()
                      })
                      .eq('id', existingDeal.id);

                    if (error) throw error;
                  } else {
                    // Criar novo deal ativo
                    const { error } = await supabase
                      .from('deals')
                      .insert({
                        lead_id: selectedContact.id,
                        value: deal.value,
                        status: deal.status,
                        note: deal.notes,
                        date: new Date().toISOString(),
                        created_by_user_id: selectedContact.id // Ajustar conforme necessário
                      });

                    if (error) throw error;
                  }

                  onUpdateContact({
                    ...selectedContact,
                    currentDeal: deal
                  });

                  toast.success("Negociação atualizada com sucesso!");
                } catch (error) {
                  console.error("Erro ao atualizar negociação:", error);
                  toast.error("Erro ao atualizar negociação");
                  throw error;
                }
              }}
            />

            {/* Histórico de Negociações */}
            <DealHistorySection 
              dealHistory={selectedContact.deals?.map(deal => ({
                id: deal.id,
                type: deal.status,
                value: deal.value,
                date: deal.date,
                stage: deal.stage || 'Não informado',
                notes: deal.note
              } as DealHistoryItem)) || []}
            />

            {/* NOTAS */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800">📝 NOTAS</h3>
                </div>
                {!isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleEditToggle}
                    className="text-gray-600 hover:text-gray-800 hover:bg-white/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Observações</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400 min-h-[100px]"
                    placeholder="Adicione observações sobre este lead..."
                  />
                ) : (
                  <div className="mt-1">
                    {selectedContact.notes ? (
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{selectedContact.notes}</p>
                    ) : (
                      <p className="text-gray-500 text-sm italic">Nenhuma observação adicionada</p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-white/30">
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="bg-white/20 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/30"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
