import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";
import { useClientWhatsApp } from "@/hooks/clients/useClientWhatsApp";

interface WhatsAppButtonProps {
  client: ClientData;
  className?: string;
}

export const WhatsAppButton = ({ client, className }: WhatsAppButtonProps) => {
  const { navigateToWhatsApp } = useClientWhatsApp();

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToWhatsApp(client.phone);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100/50 ${className || ""}`}
      onClick={handleWhatsAppClick}
      title={`Enviar mensagem WhatsApp para ${client.name}`}
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
};