
import { ModernCard, ModernCardContent, ModernCardHeader } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Plus, Smartphone } from "lucide-react";

interface WhatsAppWebEmptyStateProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export const WhatsAppWebEmptyState = ({
  onConnect,
  isConnecting
}: WhatsAppWebEmptyStateProps) => {
  return (
    <ModernCard className="border-2 border-dashed border-green-300/50 bg-green-50/30">
      <ModernCardHeader>
        <div className="flex flex-col items-center text-center space-y-6 py-8">
          <div className="p-6 bg-green-100/70 rounded-2xl">
            <MessageSquare className="h-12 w-12 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Conecte seu primeiro WhatsApp
            </h3>
            <p className="text-muted-foreground/80 max-w-md">
              Crie sua primeira instância para começar a gerenciar conversas e atender seus clientes
            </p>
          </div>

          <Button 
            onClick={onConnect}
            disabled={isConnecting}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Conectar WhatsApp
              </>
            )}
          </Button>

          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/50 max-w-md">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                <p className="font-medium">Como funciona:</p>
                <p>1. Clique em "Conectar WhatsApp"</p>
                <p>2. Escaneie o QR Code com seu celular</p>
                <p>3. Comece a gerenciar suas conversas</p>
              </div>
            </div>
          </div>
        </div>
      </ModernCardHeader>
    </ModernCard>
  );
};
