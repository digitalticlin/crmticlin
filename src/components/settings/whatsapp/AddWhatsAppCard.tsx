
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
  <Card className="overflow-hidden border-0 shadow-xl glass-morphism backdrop-blur-xl bg-white/20 dark:bg-black/30 transition-transform hover:scale-105 duration-200 min-h-[290px] flex flex-col items-center justify-center">
    <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl bg-gradient-to-br from-white/35 via-transparent to-white/10 dark:from-white/20 dark:to-black/10" />
    <CardContent className="p-0 flex flex-col items-center text-center space-y-2 relative z-10">
      <div className="mb-2">
        <MessageSquare className="h-12 w-12 text-green-500" />
      </div>
      <h3 className="font-medium text-lg text-white/90 dark:text-white">Adicionar WhatsApp</h3>
      {!isSuperAdmin && !isNewUser ? (
        <p className="text-sm text-white/60 dark:text-white/60">
          Disponível apenas em planos superiores. Atualize seu plano.
        </p>
      ) : isNewUser ? (
        <p className="text-sm text-white/70 dark:text-white/70">
          Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
        </p>
      ) : (
        <p className="text-sm text-white/70 dark:text-white/70">
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
