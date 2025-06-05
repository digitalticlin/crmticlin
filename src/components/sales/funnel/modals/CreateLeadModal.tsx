
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeadCreation } from "@/hooks/salesFunnel/useLeadCreation";
import { useSalesFunnelContext } from "../SalesFunnelProvider";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateLeadModal = ({ isOpen, onClose }: CreateLeadModalProps) => {
  const { createLead, isLoading } = useLeadCreation();
  const { stages, availableTags } = useSalesFunnelContext();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    address: "",
    purchaseValue: undefined as number | undefined,
    kanbanStageId: "",
    tags: [] as string[],
    notes: ""
  });

  const availableStages = stages?.filter(stage => 
    stage.title !== "GANHO" && stage.title !== "PERDIDO"
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.kanbanStageId) {
      return;
    }

    try {
      await createLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        company: formData.company,
        address: formData.address,
        purchaseValue: formData.purchaseValue,
        kanbanStageId: formData.kanbanStageId,
        tags: formData.tags,
        notes: formData.notes
      });
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        address: "",
        purchaseValue: undefined,
        kanbanStageId: "",
        tags: [],
        notes: ""
      });
      
      onClose();
    } catch (error) {
      console.error("Erro ao criar lead:", error);
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/10 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Criar Novo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </div>
            <div>
              <Label htmlFor="purchaseValue">Valor Estimado</Label>
              <Input
                id="purchaseValue"
                type="number"
                value={formData.purchaseValue || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  purchaseValue: e.target.value ? Number(e.target.value) : undefined 
                }))}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Endereço completo"
            />
          </div>

          <div>
            <Label htmlFor="stage">Etapa do Funil *</Label>
            <Select
              value={formData.kanbanStageId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, kanbanStageId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar etapa" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      formData.tags.includes(tag.id)
                        ? "border-blue-500 bg-blue-100 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.phone || !formData.kanbanStageId}
              className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
            >
              {isLoading ? "Criando..." : "Criar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
