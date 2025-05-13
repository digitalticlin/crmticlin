
import { useState } from "react";
import { Contact } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";

interface ClientFormProps {
  client?: Contact;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const ClientForm = ({ client, onSubmit, onCancel }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    name: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    company: client?.company || "", // Added company field
    notes: client?.notes || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Nome e telefone são campos obrigatórios");
      return;
    }
    
    // Format data and add creation date for new clients
    const data = {
      ...formData,
      createdAt: client?.createdAt || new Date().toLocaleDateString('pt-BR'),
    };
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome*</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nome do cliente"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <div className="relative">
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Nome da empresa"
            className="pl-8"
          />
          <Building className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone*</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(00) 00000-0000"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          placeholder="email@exemplo.com"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Endereço do cliente"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Observações sobre o cliente"
          className="min-h-[100px]"
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {client ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
};
