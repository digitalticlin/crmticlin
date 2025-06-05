
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Zap } from "lucide-react";
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
      <DialogContent className="sm:max-w-[500px] bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-ticlin/20 to-ticlin/40 rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-ticlin-dark" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">Criar Novo Funil</DialogTitle>
          <p className="text-gray-600">Configure seu novo funil de vendas</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="funnel-name" className="text-gray-700 font-medium">
              Nome do Funil *
            </Label>
            <Input
              id="funnel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Funil de Vendas Principal"
              required
              className="bg-white/50 border-white/30 rounded-2xl h-12 text-gray-800 placeholder-gray-500 focus:bg-white/70 focus:border-ticlin/50 transition-all duration-300"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="funnel-description" className="text-gray-700 font-medium">
              Descrição (opcional)
            </Label>
            <Textarea
              id="funnel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste funil..."
              rows={3}
              className="bg-white/50 border-white/30 rounded-2xl text-gray-800 placeholder-gray-500 focus:bg-white/70 focus:border-ticlin/50 transition-all duration-300 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-white/50 border-white/30 hover:bg-white/70 text-gray-700 hover:text-gray-800 rounded-2xl px-6 py-2.5 h-auto transition-all duration-300"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-ticlin to-ticlin-dark hover:from-ticlin-dark hover:to-ticlin text-black rounded-2xl px-6 py-2.5 h-auto shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Funil
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
