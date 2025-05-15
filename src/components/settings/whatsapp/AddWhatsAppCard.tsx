
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddWhatsAppCardProps {
  isSuperAdmin?: boolean;
  isNewUser: boolean;
  isCreating: boolean;
  onAdd: () => void;
}

// Novo fundo igual ao card de instância conectada
const cardBg = "linear-gradient(125deg, rgba(30,32,39,0.94) 60%, rgba(28,28,36,0.88) 100%)";

const AddWhatsAppCard = ({
  isSuperAdmin = false,
  isNewUser,
  isCreating,
  onAdd,
}: AddWhatsAppCardProps) => (
  <Card
    className={`
      relative overflow-hidden border-0 shadow-xl 
      rounded-2xl
      w-full max-w-xl mx-auto
      flex flex-col items-center justify-center
      glass-morphism
      transition-transform hover:scale-105 duration-200
      min-h-[330px]
    `}
    style={{
      background: cardBg,
      boxShadow: "0 8px 40px 0 rgba(16,20,29,0.11), 0 2px 10px 0 rgba(0,0,0,0.04)",
    }}
  >
    {/* Camada para efeito de vidro extra se desejar */}
    <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl" />
    <CardContent className="flex flex-col items-center text-center space-y-2 relative z-10 px-10 py-10">
      <div className="mb-2">
        <MessageSquare className="h-12 w-12 text-green-500" />
      </div>
      <h3 className="font-semibold text-xl text-white mb-1">Adicionar WhatsApp</h3>
      {!isSuperAdmin && !isNewUser ? (
        <p className="text-sm text-white/60">
          Disponível apenas em planos superiores. Atualize seu plano.
        </p>
      ) : isNewUser ? (
        <p className="text-sm text-white/70">
          Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
        </p>
      ) : (
        <p className="text-sm text-white/70">
          Como SuperAdmin, adicione quantos números quiser.
        </p>
      )}
      <Button
        variant="whatsapp"
        size="sm"
        className="mt-4 px-5 py-2 text-base font-semibold rounded-lg"
        disabled={(!isSuperAdmin && !isNewUser) || isCreating}
        onClick={onAdd}
      >
        {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
      </Button>
    </CardContent>
  </Card>
);

export default AddWhatsAppCard;
