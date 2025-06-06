
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
            Criar Novo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-800 font-medium">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                required
                className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-gray-800 font-medium">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                required
                className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-800 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company" className="text-gray-800 font-medium">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nome da empresa"
                className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800"
              />
            </div>
            <div>
              <Label htmlFor="purchaseValue" className="text-gray-800 font-medium">Valor Estimado</Label>
              <Input
                id="purchaseValue"
                type="number"
                value={formData.purchaseValue || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  purchaseValue: e.target.value ? Number(e.target.value) : undefined 
                }))}
                placeholder="0,00"
                className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-gray-800 font-medium">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Endereço completo"
              className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800"
            />
          </div>

          <div>
            <Label htmlFor="stage" className="text-gray-800 font-medium">Etapa do Funil *</Label>
            <Select
              value={formData.kanbanStageId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, kanbanStageId: value }))}
              required
            >
              <SelectTrigger className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl text-gray-800">
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
              <Label className="text-gray-800 font-medium">Etiquetas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all backdrop-blur-sm ${
                      formData.tags.includes(tag.id)
                        ? "border-ticlin bg-ticlin/20 text-ticlin-dark"
                        : "border-white/40 bg-white/30 hover:bg-white/40 text-gray-800"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="text-gray-800 font-medium">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o lead..."
              rows={3}
              className="mt-1 bg-white/60 backdrop-blur-sm border-white/40 rounded-xl resize-none text-gray-800"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 rounded-xl px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.phone || !formData.kanbanStageId}
              className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black hover:from-ticlin/90 hover:to-ticlin-dark/90 border border-white/30 backdrop-blur-sm rounded-xl px-6"
            >
              {isLoading ? "Criando..." : "Criar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
