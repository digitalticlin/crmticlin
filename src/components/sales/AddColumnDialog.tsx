
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useSalesFunnelContext } from "./funnel/SalesFunnelProvider";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
import { toast } from "sonner";

interface AddColumnDialogProps {
  onAddColumn?: (title: string) => void;
}

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#6b7280", // gray
  "#ec4899", // pink
  "#14b8a6", // teal
];

export const AddColumnDialog = ({ onAddColumn }: AddColumnDialogProps) => {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { selectedFunnel, refetchStages } = useSalesFunnelContext();
  const { addColumn } = useStageManagement();

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) {
      toast.error("Nome da etapa é obrigatório");
      return;
    }

    if (!selectedFunnel?.id) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    setIsLoading(true);
    try {
      console.log('[AddColumnDialog] Criando nova etapa:', {
        title: newColumnTitle.trim(),
        color: selectedColor,
        funnelId: selectedFunnel.id
      });

      // Usar o hook diretamente para adicionar a coluna
      await addColumn(newColumnTitle.trim(), selectedColor, selectedFunnel.id);
      
      console.log('[AddColumnDialog] Etapa criada com sucesso, fazendo refetch...');
      
      // Refresh das colunas
      await refetchStages();
      
      // Callback de compatibilidade se fornecido
      if (onAddColumn) {
        onAddColumn(newColumnTitle.trim());
      }
      
      // Reset do form
      setNewColumnTitle("");
      setSelectedColor(COLORS[0]);
      setIsOpen(false);
      
      toast.success("Etapa criada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar etapa:", error);
      toast.error(error.message || "Erro ao criar etapa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewColumnTitle("");
    setSelectedColor(COLORS[0]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Etapa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="stage-name">Nome da Etapa</Label>
            <Input
              id="stage-name"
              placeholder="Nome da etapa"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Cor da Etapa</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddColumn}
            disabled={isLoading || !newColumnTitle.trim()}
            className="bg-ticlin hover:bg-ticlin/90 text-black"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
