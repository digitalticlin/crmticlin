
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddWhatsAppCardProps {
  isSuperAdmin?: boolean;
  isNewUser: boolean;
  isCreating: boolean;
  onAdd: () => void;
}

const AddWhatsAppCard = ({
  isSuperAdmin = false,
  isNewUser,
  isCreating,
  onAdd,
}: AddWhatsAppCardProps) => (
  <Card className="overflow-hidden glass-card border-0 flex flex-col items-center justify-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent">
    <CardContent className="p-0 flex flex-col items-center text-center space-y-2">
      <div className="mb-2">
        <MessageSquare className="h-12 w-12 text-green-500" />
      </div>
      <h3 className="font-medium">Adicionar número</h3>
      {!isSuperAdmin && !isNewUser ? (
        <p className="text-sm text-muted-foreground">
          Disponível apenas em planos superiores. Atualize seu plano.
        </p>
      ) : isNewUser ? (
        <p className="text-sm text-muted-foreground">
          Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Como SuperAdmin, adicione quantos números quiser.
        </p>
      )}
      <Button
        variant="whatsapp"
        size="sm"
        className="mt-2"
        disabled={(!isSuperAdmin && !isNewUser) || isCreating}
        onClick={onAdd}
      >
        {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
      </Button>
    </CardContent>
  </Card>
);

export default AddWhatsAppCard;
