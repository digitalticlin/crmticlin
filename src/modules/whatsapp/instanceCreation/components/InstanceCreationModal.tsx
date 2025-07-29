
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare } from "lucide-react";
import { useInstanceCreation } from '../hooks/useInstanceCreation';

interface InstanceCreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstanceCreationModal = ({ isOpen, onOpenChange }: InstanceCreationModalProps) => {
  const [instanceName, setInstanceName] = useState('');
  const { createInstance, isCreating } = useInstanceCreation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim()) return;
    
    const result = await createInstance(instanceName);
    if (result.success) {
      onOpenChange(false);
      setInstanceName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Criar Nova Instância WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escolha um nome para sua nova instância WhatsApp
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Ex: whatsapp-vendas"
              disabled={isCreating}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="whatsapp"
              disabled={isCreating || !instanceName.trim()}
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
        </form>
      </DialogContent>
    </Dialog>
  );
};
