
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
}

export const CreateFunnelModal = ({ isOpen, onClose, onCreateFunnel }: CreateFunnelModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Nome do funil é obrigatório");
      return;
    }

    setLoading(true);
    try {
      await onCreateFunnel(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      onClose();
      toast.success("Funil criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar funil:", error);
      toast.error("Erro ao criar funil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Funil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="funnel-name">Nome do Funil *</Label>
            <Input
              id="funnel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Funil de Vendas Principal"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="funnel-description">Descrição (opcional)</Label>
            <Textarea
              id="funnel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste funil..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Funil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
