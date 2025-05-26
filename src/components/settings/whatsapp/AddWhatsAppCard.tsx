import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AddWhatsAppCardProps {
  isSuperAdmin?: boolean;
  isNewUser: boolean;
  isCreating: boolean;
  onAdd: () => void;
}

const cardBg =
  "linear-gradient(125deg, rgba(30,32,39,0.94) 60%, rgba(28,28,36,0.88) 100%)";

const AddWhatsAppCard = ({
  isSuperAdmin = false,
  isNewUser,
  isCreating,
  onAdd,
}: AddWhatsAppCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 shadow-xl rounded-2xl",
        "glass-morphism transition-transform hover:scale-105 duration-200",
        "w-full max-w-sm md:max-w-md mx-auto flex flex-col items-center",
        "min-h-[260px] md:min-h-[250px] md:min-w-[450px]"
      )}
      style={{
        background: cardBg,
        boxShadow:
          "0 8px 40px 0 rgba(16,20,29,0.11), 0 2px 10px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl" />
      <CardContent
        className={cn(
          "relative z-10 h-full flex flex-col items-center justify-between text-center px-6 py-8 gap-4"
        )}
      >
        {/* Ícone centralizado, espaçado do topo */}
        <div className="flex items-center justify-center rounded-2xl mx-auto mb-2 bg-white/10 backdrop-blur-sm border border-white/20 w-16 h-16">
          <MessageSquare className="text-green-400 h-8 w-8" />
        </div>

        {/* Texto e instruções */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h3 className="font-bold text-white text-lg mb-1">Adicionar WhatsApp</h3>
          {!isSuperAdmin && !isNewUser ? (
            <p className="text-white/60 mb-0 text-sm">
              Disponível apenas em planos superiores.<br />Atualize seu plano.
            </p>
          ) : isNewUser ? (
            <p className="text-white/70 mb-0 text-sm">
              Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
            </p>
          ) : (
            <p className="text-white/70 mb-0 text-sm">
              Como SuperAdmin, adicione quantos números quiser.
            </p>
          )}
        </div>

        {/* Botão centralizado e espaçado da base */}
        <Button
          variant="whatsapp"
          size="lg"
          className={cn(
            "font-semibold rounded-lg shadow-lg",
            "w-full md:w-[90%] mx-auto",
            isMobile ? "text-sm" : "text-base"
          )}
          disabled={(!isSuperAdmin && !isNewUser) || isCreating}
          onClick={onAdd}
        >
          <Plus className="mr-2 w-5 h-5" />
          {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddWhatsAppCard;
