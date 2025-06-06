
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
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-[#d3d800]/30 shadow-xl shadow-[#d3d800]/10">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white font-medium">Nome*</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nome do cliente"
            required
            disabled={isLoading}
            className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company" className="text-white font-medium">Empresa</Label>
          <div className="relative">
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Nome da empresa"
              className="pl-8 bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
              disabled={isLoading}
            />
            <Building className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#d3d800]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white font-medium">Telefone*</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            required
            disabled={isLoading}
            className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white font-medium">Email</Label>
          <Input
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            placeholder="email@exemplo.com"
            disabled={isLoading}
            className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address" className="text-white font-medium">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Endereço do cliente"
            disabled={isLoading}
            className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_value" className="text-white font-medium">Valor de Compra</Label>
          <Input
            id="purchase_value"
            name="purchase_value"
            type="number"
            step="0.01"
            value={formData.purchase_value || ""}
            onChange={handleChange}
            placeholder="0.00"
            disabled={isLoading}
            className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-white font-medium">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Observações sobre o cliente"
            className="min-h-[100px] bg-white/20 backdrop-blur-sm border-white/40 focus:border-[#d3d800] focus:ring-[#d3d800]/20 text-white placeholder:text-white/60"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
            className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-[#d3d800]/80 hover:bg-[#d3d800] text-black border-2 border-[#d3d800] shadow-lg font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : (client ? "Atualizar" : "Adicionar")}
          </Button>
        </div>
      </form>
    </div>
  );
};
