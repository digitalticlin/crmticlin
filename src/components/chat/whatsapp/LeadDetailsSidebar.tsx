// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, User, Building2, Mail, DollarSign, Calendar, Tag, Phone, Edit, MapPin } from "lucide-react";
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
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const companyInputRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: "",
    hasCompany: false,
    companyName: "",
    companySegment: "",
    companyCnpj: "",
    companyAddress: "",
    companyCidade: "",
    companyEstado: "",
    companyCountry: ""
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
        notes: selectedContact.notes || "",
        hasCompany: (selectedContact as any).has_company || false,
        companyName: selectedContact.company || "",
        companySegment: (selectedContact as any).company_segment || "",
        companyCnpj: (selectedContact as any).company_cnpj || "",
        companyAddress: (selectedContact as any).company_address || "",
        companyCidade: (selectedContact as any).company_cidade || "",
        companyEstado: (selectedContact as any).company_estado || "",
        companyCountry: (selectedContact as any).company_country || "Brasil"
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
            .select('id, name, email, company, purchase_value, notes, has_company, company_segment, company_cnpj, company_address, company_cidade, company_estado')
            .eq('id', leadId)
            .single();
          
          if (!error && freshData) {
            console.log('[LeadDetailsSidebar] 🔄 Dados frescos carregados:', freshData);
            setFormData({
              name: freshData.name || "",
              email: freshData.email || "",
              notes: freshData.notes || "",
              hasCompany: freshData.has_company || false,
              companyName: freshData.company || "",
              companySegment: freshData.company_segment || "",
              companyCnpj: freshData.company_cnpj || "",
              companyAddress: freshData.company_address || "",
              companyCidade: freshData.company_cidade || "",
              companyEstado: freshData.company_estado || "",
              companyCountry: freshData.company_country || "Brasil"
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

  // Effect para fechar sugestões quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyInputRef.current && !companyInputRef.current.contains(event.target as Node)) {
        setShowCompanySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedContact) return;

    setIsSaving(true);
    try {
      const { 
        name, email, notes,
        hasCompany, companyName, companySegment, companyCnpj, companyAddress, companyCidade, companyEstado, companyCountry
      } = formData;

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
          notes: notes || null,
          has_company: hasCompany,
          company: hasCompany ? companyName || null : null,
          company_segment: hasCompany ? companySegment || null : null,
          company_cnpj: hasCompany ? companyCnpj || null : null,
          company_address: hasCompany ? companyAddress || null : null,
          company_cidade: hasCompany ? companyCidade || null : null,
          company_estado: hasCompany ? companyEstado || null : null,
          company_country: hasCompany ? companyCountry || null : null,
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
    setShowCompanySuggestions(false);
  };

  // Função para buscar empresas existentes com debounce
  const searchCompanies = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm || searchTerm.length < 2) {
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
      return;
    }

    setIsSearchingCompany(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Buscar empresas únicas com os campos da empresa (apenas do mesmo admin user)
        const { data, error } = await supabase
          .from('leads')
          .select('company, company_segment, company_cnpj, company_address, company_cidade, company_estado, company_country, created_by_user_id')
          .ilike('company', `%${searchTerm}%`)
          .not('company', 'is', null)
          .eq('created_by_user_id', selectedContact?.created_by_user_id)
          .limit(5);

        if (!error && data) {
          // Agrupar por nome da empresa para evitar duplicatas
          const uniqueCompanies = data.reduce((acc: any[], lead) => {
            if (lead.company && !acc.find(c => c.company === lead.company)) {
              acc.push(lead);
            }
            return acc;
          }, []);
          
          setCompanySuggestions(uniqueCompanies);
          setShowCompanySuggestions(uniqueCompanies.length > 0);
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      } finally {
        setIsSearchingCompany(false);
      }
    }, 300); // Delay de 300ms
  }, []);

  // Função para selecionar uma empresa existente
  const selectCompany = useCallback((companyData: any) => {
    setFormData(prev => ({
      ...prev,
      companyName: companyData.company || '',
      companySegment: companyData.company_segment || '',
      companyCnpj: companyData.company_cnpj || '',
      companyAddress: companyData.company_address || '',
      companyCidade: companyData.company_cidade || '',
      companyEstado: companyData.company_estado || '',
      companyCountry: companyData.company_country || 'Brasil'
    }));
    setShowCompanySuggestions(false);
    toast.success(`Empresa "${companyData.company}" selecionada e campos preenchidos!`);
  }, []);

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

            {/* Endereço do Lead */}
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

            {/* Seção da Empresa */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-800">🏢 Informações da Empresa</h3>
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
                {/* Toggle "Lead possui empresa?" - sempre visível */}
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                  <Label htmlFor="hasCompany" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Lead possui empresa?
                  </Label>
                  <Switch
                    id="hasCompany"
                    checked={formData.hasCompany}
                    onCheckedChange={async (checked) => {
                      const newFormData = { 
                        ...formData, 
                        hasCompany: checked,
                        // Limpar campos da empresa se desativado
                        ...(!checked && {
                          companyName: "",
                          companySegment: "",
                          companyCnpj: "",
                          companyAddress: "",
                          companyCidade: "",
                          companyEstado: "",
                          companyCountry: ""
                        })
                      };
                      setFormData(newFormData);
                      
                      // Salvar imediatamente no banco
                      try {
                        await supabase
                          .from('leads')
                          .update({
                            has_company: checked,
                            company: checked ? newFormData.companyName || null : null,
                            company_segment: checked ? newFormData.companySegment || null : null,
                            company_cnpj: checked ? newFormData.companyCnpj || null : null,
                            company_address: checked ? newFormData.companyAddress || null : null,
                            company_cidade: checked ? newFormData.companyCidade || null : null,
                            company_estado: checked ? newFormData.companyEstado || null : null,
                            company_country: checked ? newFormData.companyCountry || null : null,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', selectedContact.id);
                        
                        toast.success(checked ? "Empresa ativada!" : "Empresa desativada!");
                      } catch (error) {
                        console.error("Erro ao atualizar empresa:", error);
                        toast.error("Erro ao atualizar informações da empresa");
                      }
                    }}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                {/* Seção expandida da empresa - só aparece se hasCompany for true */}
                {formData.hasCompany && (
                  <div className="space-y-4 border-t border-white/30 pt-4">
                    {/* Nome da Empresa */}
                    <div className="space-y-2 relative" ref={companyInputRef}>
                      <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Nome da Empresa *</Label>
                      {isEditing ? (
                        <>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, companyName: e.target.value }));
                              searchCompanies(e.target.value);
                            }}
                            className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                            placeholder="Digite para buscar empresas existentes..."
                            required={formData.hasCompany}
                            autoComplete="off"
                          />
                          
                          {/* Lista de sugestões de empresas */}
                          {showCompanySuggestions && companySuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                              {isSearchingCompany && (
                                <div className="p-2 text-center text-gray-500 text-sm">
                                  Buscando empresas...
                                </div>
                              )}
                              {!isSearchingCompany && companySuggestions.map((company, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                  onClick={() => selectCompany(company)}
                                >
                                  <div className="font-medium text-gray-900">{company.company}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {company.company_segment && <span>Segmento: {company.company_segment}</span>}
                                    {company.company_cnpj && <span className="ml-2">• CNPJ: {company.company_cnpj}</span>}
                                  </div>
                                  {company.company_cidade && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {company.company_cidade}{company.company_estado && `/${company.company_estado}`}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-800 mt-1 font-medium">{formData.companyName || "Não informado"}</p>
                      )}
                    </div>

                    {/* Segmento da Empresa */}
                    <div className="space-y-2">
                      <Label htmlFor="companySegment" className="text-sm font-medium text-gray-700">Segmento</Label>
                      {isEditing ? (
                        <Input
                          id="companySegment"
                          value={formData.companySegment}
                          onChange={(e) => setFormData(prev => ({ ...prev, companySegment: e.target.value }))}
                          className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                          placeholder="Ex: Tecnologia, Comércio, Serviços..."
                        />
                      ) : (
                        <p className="text-gray-800 mt-1">{formData.companySegment || "Não informado"}</p>
                      )}
                    </div>

                    {/* CNPJ */}
                    <div className="space-y-2">
                      <Label htmlFor="companyCnpj" className="text-sm font-medium text-gray-700">CNPJ</Label>
                      {isEditing ? (
                        <Input
                          id="companyCnpj"
                          value={formData.companyCnpj}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyCnpj: e.target.value }))}
                          className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                          placeholder="00.000.000/0000-00"
                        />
                      ) : (
                        <p className="text-gray-800 mt-1">{formData.companyCnpj || "Não informado"}</p>
                      )}
                    </div>

                    {/* Endereço da Empresa */}
                    <div className="space-y-4 border-t border-white/20 pt-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-semibold text-gray-700">Endereço da Empresa</h4>
                      </div>

                      {/* Endereço */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress" className="text-sm font-medium text-gray-700">Endereço</Label>
                        {isEditing ? (
                          <Input
                            id="companyAddress"
                            value={formData.companyAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                            className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                            placeholder="Rua, número, complemento"
                          />
                        ) : (
                          <p className="text-gray-800 mt-1">{formData.companyAddress || "Não informado"}</p>
                        )}
                      </div>

                      {/* Cidade */}
                      <div className="space-y-2">
                        <Label htmlFor="companyCidade" className="text-sm font-medium text-gray-700">Cidade</Label>
                        {isEditing ? (
                          <Input
                            id="companyCidade"
                            value={formData.companyCidade}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyCidade: e.target.value }))}
                            className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                            placeholder="Cidade"
                          />
                        ) : (
                          <p className="text-gray-800 mt-1">{formData.companyCidade || "Não informado"}</p>
                        )}
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <Label htmlFor="companyEstado" className="text-sm font-medium text-gray-700">Estado</Label>
                        {isEditing ? (
                          <Select
                            value={formData.companyEstado}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, companyEstado: value }))}
                          >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-gray-800 mt-1">{formData.companyEstado || "Não informado"}</p>
                        )}
                      </div>

                      {/* País */}
                      <div className="space-y-2">
                        <Label htmlFor="companyCountry" className="text-sm font-medium text-gray-700">País</Label>
                        {isEditing ? (
                          <Input
                            id="companyCountry"
                            value={formData.companyCountry}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyCountry: e.target.value }))}
                            className="mt-1 bg-white/50 backdrop-blur-sm border-white/40 focus:border-blue-400"
                            placeholder="País"
                          />
                        ) : (
                          <p className="text-gray-800 mt-1">{formData.companyCountry || "Não informado"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>


            {/* Negociação Atual */}
            <CurrentDealSection 
              currentDeal={selectedContact.currentDeal || {
                value: selectedContact.purchaseValue || 0,
                status: 'pending',
                currentStage: 'Inicial',
                startDate: selectedContact.created_at,
                notes: 'Valor inicial do lead'
              }}
              onUpdateDeal={async (deal: CurrentDeal) => {
                try {
                  // Atualizar o purchase_value na tabela leads sempre
                  const { error: leadError } = await supabase
                    .from('leads')
                    .update({
                      purchase_value: deal.value,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedContact.id);

                  if (leadError) throw leadError;

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
                  } else if (deal.status !== 'pending' || deal.notes !== 'Valor inicial do lead') {
                    // Criar novo deal ativo somente se não for o valor inicial padrão
                    const { error } = await supabase
                      .from('deals')
                      .insert({
                        lead_id: selectedContact.id,
                        value: deal.value,
                        status: deal.status,
                        note: deal.notes,
                        date: new Date().toISOString(),
                        created_by_user_id: selectedContact.created_by_user_id
                      });

                    if (error) throw error;
                  }

                  onUpdateContact({
                    ...selectedContact,
                    purchaseValue: deal.value,
                    currentDeal: deal
                  });

                  toast.success("Valor de negociação atualizado com sucesso!");
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
                type: ['won', 'closed_won', 'completed'].includes(deal.status) ? 'win' : 
                      ['lost', 'closed_lost', 'rejected', 'cancelled'].includes(deal.status) ? 'loss' : 
                      'loss', // Por padrão, considera como perda se não for ganho explícito
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
