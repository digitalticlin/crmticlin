
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { toast } from "sonner";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean; // Indica se o usuário é SuperAdmin e não tem restrições de plano
}

const PlaceholderInstanceCard = ({ isSuperAdmin = false }: PlaceholderInstanceCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { addNewInstance } = useWhatsAppInstances("");

  const handleAddWhatsApp = async () => {
    if (!instanceName.trim()) {
      toast.error("Por favor, informe um nome para a instância");
      return;
    }

    setIsCreating(true);
    try {
      await addNewInstance(instanceName.trim());
      toast.success("Solicitação de conexão enviada com sucesso!");
      setIsDialogOpen(false);
      setInstanceName("");
    } catch (error) {
      console.error("Erro ao criar instância:", error);
      toast.error("Não foi possível criar a instância de WhatsApp");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDialog = () => {
    if (!isSuperAdmin) {
      toast.error("Disponível apenas em planos superiores. Atualize seu plano.");
      return;
    }
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden glass-card border-0 flex flex-col items-center justify-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent">
        <CardContent className="p-0 flex flex-col items-center text-center space-y-2">
          <div className="mb-2">
            <MessageSquare className="h-12 w-12 text-green-500" />
          </div>
          
          <h3 className="font-medium">Adicionar número</h3>
          
          {!isSuperAdmin ? (
            <p className="text-sm text-muted-foreground">
              Disponível em planos superiores. Atualize seu plano para adicionar mais números de WhatsApp.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Como SuperAdmin, você pode adicionar quantos números quiser.
            </p>
          )}
          
          <Button 
            variant="whatsapp"
            size="sm"
            className="mt-2"
            disabled={!isSuperAdmin}
            onClick={handleOpenDialog}
          >
            {isSuperAdmin ? "Adicionar WhatsApp" : "Atualizar plano"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar novo número de WhatsApp</DialogTitle>
            <DialogDescription>
              Digite um nome para identificar este número. Este nome será usado para criar a instância no Evolution API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Ex: Vendas, Suporte, Atendimento..."
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              variant="whatsapp"
              onClick={handleAddWhatsApp}
              disabled={isCreating || !instanceName.trim()}
            >
              {isCreating ? "Criando..." : "Criar instância"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceholderInstanceCard;
