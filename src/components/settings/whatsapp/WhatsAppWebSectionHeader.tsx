
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WhatsAppWebSectionHeaderProps {
  onConnect: () => void;
  isConnecting: boolean;
  isLoading: boolean;
  companyLoading: boolean;
  isWaitingForQR?: boolean;
}

export const WhatsAppWebSectionHeader = ({
  onConnect,
  isConnecting,
  isLoading,
  companyLoading,
  isWaitingForQR = false
}: WhatsAppWebSectionHeaderProps) => {
  const isDisabled = isConnecting || isLoading || companyLoading;
  const showLoadingState = isConnecting || isWaitingForQR;

  return (
    <ModernCard className={`transition-all duration-300 ${showLoadingState ? 'border-green-300/50 bg-green-50/30' : 'bg-white/60'}`}>
      <ModernCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              showLoadingState 
                ? 'bg-green-100/70 animate-pulse' 
                : 'bg-green-100/70'
            }`}>
              {showLoadingState ? (
                <Loader2 className="h-7 w-7 text-green-600 animate-spin" />
              ) : (
                <MessageSquare className="h-7 w-7 text-green-600" />
              )}
            </div>
            <div>
              <ModernCardTitle className="text-xl font-semibold">
                {showLoadingState ? 'Preparando Conexão...' : 'WhatsApp'}
              </ModernCardTitle>
              <p className="text-sm text-muted-foreground/80 mt-1">
                {showLoadingState 
                  ? 'Configurando sua instância WhatsApp...' 
                  : 'Conecte e gerencie seu WhatsApp'
                }
              </p>
            </div>
          </div>
          
          {!showLoadingState && (
            <Button
              onClick={onConnect}
              disabled={isDisabled}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar WhatsApp
                </>
              )}
            </Button>
          )}
        </div>
        
        {showLoadingState && (
          <div className="mt-4 space-y-3">
            <Progress value={33} className="w-full h-2 bg-green-100/50" />
            <div className="flex items-center justify-between text-xs text-green-700">
              <span>Criando instância...</span>
              <span>Preparando QR Code</span>
            </div>
          </div>
        )}
      </ModernCardHeader>
    </ModernCard>
  );
};
