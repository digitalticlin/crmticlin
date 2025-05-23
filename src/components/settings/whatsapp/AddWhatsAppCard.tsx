
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

const cardBg = "linear-gradient(125deg, rgba(30,32,39,0.94) 60%, rgba(28,28,36,0.88) 100%)";

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
        isMobile 
          ? "w-full min-h-[280px] mx-auto" 
          : "w-full max-w-2xl min-h-[200px] mx-auto"
      )}
      style={{
        background: cardBg,
        boxShadow: "0 8px 40px 0 rgba(16,20,29,0.11), 0 2px 10px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl" />
      <CardContent className={cn(
        "relative z-10 h-full",
        isMobile 
          ? "flex flex-col items-center text-center space-y-4 p-6" 
          : "flex flex-row items-center space-x-6 p-8"
      )}>
        {/* Icon Section */}
        <div className={cn(
          "flex items-center justify-center rounded-2xl",
          "bg-white/10 backdrop-blur-sm border border-white/20",
          isMobile ? "w-16 h-16 mb-2" : "w-20 h-20 flex-shrink-0"
        )}>
          <MessageSquare className={cn(
            "text-green-400",
            isMobile ? "h-8 w-8" : "h-10 w-10"
          )} />
        </div>

        {/* Content Section */}
        <div className={cn(
          "flex-1",
          isMobile ? "text-center" : "text-left"
        )}>
          <h3 className={cn(
            "font-bold text-white mb-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            Adicionar WhatsApp
          </h3>
          
          {!isSuperAdmin && !isNewUser ? (
            <p className={cn(
              "text-white/60 mb-4",
              isMobile ? "text-sm" : "text-base"
            )}>
              Disponível apenas em planos superiores. Atualize seu plano.
            </p>
          ) : isNewUser ? (
            <p className={cn(
              "text-white/70 mb-4",
              isMobile ? "text-sm" : "text-base"
            )}>
              Como novo administrador, você pode adicionar seu primeiro número de WhatsApp.
            </p>
          ) : (
            <p className={cn(
              "text-white/70 mb-4",
              isMobile ? "text-sm" : "text-base"
            )}>
              Como SuperAdmin, adicione quantos números quiser.
            </p>
          )}

          <Button
            variant="whatsapp"
            size={isMobile ? "default" : "lg"}
            className={cn(
              "font-semibold rounded-lg shadow-lg",
              isMobile ? "w-full px-4 py-2 text-sm" : "px-6 py-3 text-base"
            )}
            disabled={(!isSuperAdmin && !isNewUser) || isCreating}
            onClick={onAdd}
          >
            <Plus className={cn("mr-2", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            {isCreating ? "Conectando..." : "Adicionar WhatsApp"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddWhatsAppCard;
