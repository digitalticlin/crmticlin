
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface WhatsAppCreateInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateInstance: (instanceName: string) => Promise<void>;
  isCreating: boolean;
}

export function WhatsAppCreateInstanceModal({
  open,
  onOpenChange,
  onCreateInstance,
  isCreating
}: WhatsAppCreateInstanceModalProps) {
  const [instanceName, setInstanceName] = useState("");

  const handleCreate = async () => {
    if (!instanceName.trim()) return;
    
    try {
      await onCreateInstance(instanceName.trim());
      setInstanceName("");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Ex: atendimento, vendas, suporte..."
              disabled={isCreating}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !instanceName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Instância'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
