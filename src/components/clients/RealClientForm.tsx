
import { useState, useEffect } from "react";
import { ClientData, ClientFormData } from "@/hooks/clients/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building, Save, X } from "lucide-react";

interface RealClientFormProps {
  client?: ClientData;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RealClientForm = ({ client, onSubmit, onCancel, isLoading }: RealClientFormProps) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    notes: "",
    purchase_value: undefined,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        company: client.company || "",
        notes: client.notes || "",
        purchase_value: client.purchase_value || undefined,
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'purchase_value' ? (value ? parseFloat(value) : undefined) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Nome e telefone são campos obrigatórios");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid Layout - 2 colunas em telas médias e grandes, 1 coluna em mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">Nome*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome do cliente"
                required
                disabled={isLoading}
                className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-700 font-medium">Empresa</Label>
              <div className="relative">
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome da empresa"
                  className="pl-8 border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
                  disabled={isLoading}
                />
                <Building className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">Telefone*</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                required
                disabled={isLoading}
                className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="email@exemplo.com"
                disabled={isLoading}
                className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
              />
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">Endereço</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Endereço do cliente"
                disabled={isLoading}
                className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
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
                className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Observações - Largura completa */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-gray-700 font-medium">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Observações sobre o cliente"
            className="min-h-[80px] border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white resize-none"
            disabled={isLoading}
          />
        </div>
        
        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
            className="order-2 sm:order-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="order-1 sm:order-2 bg-[#d3d800] hover:bg-[#b8c200] text-black font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : (client ? "Atualizar" : "Adicionar")}
          </Button>
        </div>
      </form>
    </div>
  );
};
