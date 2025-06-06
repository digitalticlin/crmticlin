import { useState, useEffect } from "react";
import { ClientData, ClientFormData, LeadContact } from "@/hooks/clients/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Building, Save, X, MapPin, FileText, Users } from "lucide-react";
import { DocumentSelector } from "./DocumentSelector";
import { MultipleContactsManager } from "./MultipleContactsManager";

interface RealClientFormProps {
  client?: ClientData;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RealClientForm = ({ client, onSubmit, onCancel, isLoading }: RealClientFormProps) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    document_type: undefined,
    document_id: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "Brasil",
    zip_code: "",
    company: "",
    notes: "",
    purchase_value: undefined,
    contacts: [],
  });

  useEffect(() => {
    if (client) {
      const contacts = client.contacts || [];
      // Se não há contatos, criar um contato principal baseado no telefone/email do cliente
      if (contacts.length === 0 && client.phone) {
        contacts.push({
          contact_type: 'phone',
          contact_value: client.phone,
          is_primary: true,
        });
        if (client.email) {
          contacts.push({
            contact_type: 'email',
            contact_value: client.email,
            is_primary: false,
          });
        }
      }

      setFormData({
        name: client.name || "",
        document_type: client.document_type,
        document_id: client.document_id || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        country: client.country || "Brasil",
        zip_code: client.zip_code || "",
        company: client.company || "",
        notes: client.notes || "",
        purchase_value: client.purchase_value || undefined,
        contacts: contacts,
      });
    } else {
      // Para novo cliente, iniciar com um contato principal
      setFormData(prev => ({
        ...prev,
        contacts: [{
          contact_type: 'phone',
          contact_value: '',
          is_primary: true,
        }]
      }));
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'purchase_value' ? (value ? parseFloat(value) : undefined) : value 
    }));
  };

  const handleDocumentTypeChange = (type: 'cpf' | 'cnpj') => {
    setFormData(prev => ({ ...prev, document_type: type, document_id: '' }));
  };

  const handleDocumentIdChange = (id: string) => {
    setFormData(prev => ({ ...prev, document_id: id }));
  };

  const handleContactsChange = (contacts: LeadContact[]) => {
    setFormData(prev => ({ ...prev, contacts }));
    
    // Atualizar telefone e email principais baseado nos contatos
    const primaryPhone = contacts.find(c => c.contact_type === 'phone' && c.is_primary);
    const primaryEmail = contacts.find(c => c.contact_type === 'email' && c.is_primary);
    
    if (primaryPhone) {
      setFormData(prev => ({ ...prev, phone: primaryPhone.contact_value }));
    }
    if (primaryEmail) {
      setFormData(prev => ({ ...prev, email: primaryEmail.contact_value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim()) {
      alert("Nome é campo obrigatório");
      return;
    }

    const primaryPhone = formData.contacts.find(c => c.contact_type === 'phone' && c.is_primary);
    if (!primaryPhone?.contact_value?.trim()) {
      alert("É necessário um telefone principal");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="rounded-3xl bg-white/35 backdrop-blur-lg border border-white/30 shadow-2xl p-6 max-h-[80vh] overflow-y-auto transition-all duration-500 hover:shadow-3xl hover:bg-white/40">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Seção: Dados Pessoais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-[#d3d800]" />
            <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">Nome Completo*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome completo do cliente"
                required
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <DocumentSelector
                documentType={formData.document_type}
                documentId={formData.document_id}
                onDocumentTypeChange={handleDocumentTypeChange}
                onDocumentIdChange={handleDocumentIdChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <Separator className="bg-white/30" />

        {/* Seção: Contatos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#d3d800]" />
            <h3 className="text-lg font-semibold text-gray-900">Contatos</h3>
          </div>
          
          <MultipleContactsManager
            contacts={formData.contacts}
            onChange={handleContactsChange}
            disabled={isLoading}
          />
        </div>

        <Separator className="bg-white/30" />

        {/* Seção: Endereço */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[#d3d800]" />
            <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip_code" className="text-gray-700 font-medium">CEP</Label>
              <Input
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="00000-000"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">Endereço</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Rua, número, complemento"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-700 font-medium">Cidade</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Nome da cidade"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-gray-700 font-medium">Estado</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Estado/UF"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-gray-700 font-medium">País</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="País"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-white/30" />

        {/* Seção: Dados da Empresa */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-[#d3d800]" />
            <h3 className="text-lg font-semibold text-gray-900">Dados da Empresa</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-700 font-medium">Nome da Empresa</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Nome da empresa"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_value" className="text-gray-700 font-medium">Valor de Compra</Label>
              <Input
                id="purchase_value"
                name="purchase_value"
                type="number"
                step="0.01"
                value={formData.purchase_value || ""}
                onChange={handleChange}
                placeholder="0.00"
                disabled={isLoading}
                className="border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-white/30" />

        {/* Seção: Observações */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#d3d800]" />
            <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700 font-medium">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observações sobre o cliente"
              className="min-h-[100px] border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white/50 backdrop-blur-sm resize-none"
              disabled={isLoading}
            />
          </div>
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/30">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
            className="order-2 sm:order-1 border-white/40 text-gray-700 hover:bg-white/30 bg-white/20 backdrop-blur-sm"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="order-1 sm:order-2 bg-[#d3d800] hover:bg-[#b8c200] text-black font-semibold shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : (client ? "Atualizar" : "Adicionar")}
          </Button>
        </div>
      </form>
    </div>
  );
};
