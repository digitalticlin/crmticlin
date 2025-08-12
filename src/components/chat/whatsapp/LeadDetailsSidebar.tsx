import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, User, Building2, Mail, DollarSign, Calendar, Tag, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SalesHistorySection } from "./sidebar/SalesHistorySection";

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
            <Card className="bg-white/20 backdrop-blur-sm border-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/30 border-white/50"
                      placeholder="Nome do lead"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{displayName}</p>
                  )}
                </div>

                {/* Telefone (sempre readonly) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <p className="text-gray-800 font-mono text-sm bg-gray-50/50 px-3 py-2 rounded-md">
                    {formatPhoneDisplay(selectedContact.phone)}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/30 border-white/50"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <p className="text-gray-800">{selectedContact.email || "Não informado"}</p>
                  )}
                </div>

                {/* Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="bg-white/30 border-white/50"
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-gray-800">{selectedContact.company || "Não informado"}</p>
                  )}
                </div>

                {/* Valor de compra */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseValue" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor de Compra
                  </Label>
                  {isEditing ? (
                    <Input
                      id="purchaseValue"
                      type="number"
                      step="0.01"
                      value={formData.purchaseValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchaseValue: e.target.value }))}
                      className="bg-white/30 border-white/50"
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="text-gray-800">
                      {selectedContact.purchaseValue 
                        ? `R$ ${Number(selectedContact.purchaseValue).toFixed(2)}` 
                        : "Não informado"
                      }
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Observações
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-white/30 border-white/50 min-h-[80px]"
                      placeholder="Observações sobre o lead..."
                    />
                  ) : (
                    <p className="text-gray-800 text-sm">
                      {selectedContact.notes || "Nenhuma observação"}
                    </p>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white/20 border-white/40 text-gray-700 hover:bg-white/30"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleEditToggle}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Editar Informações
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {selectedContact.tags && selectedContact.tags.length > 0 && (
              <Card className="bg-white/20 backdrop-blur-sm border-white/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico de vendas */}
            {selectedContact.deals && selectedContact.deals.length > 0 && (
              <SalesHistorySection deals={selectedContact.deals} />
            )}

            {/* Informações de contato adicionais */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última mensagem:</span>
                  <span className="text-gray-800 font-medium">
                    {selectedContact.lastMessageTime 
                      ? new Date(selectedContact.lastMessageTime).toLocaleDateString('pt-BR')
                      : "Nunca"
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mensagens não lidas:</span>
                  <Badge variant={selectedContact.unreadCount > 0 ? "destructive" : "secondary"}>
                    {selectedContact.unreadCount || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
