
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Loader2 } from "lucide-react";

interface WhatsAppWebSectionHeaderProps {
  onConnect: () => void;
  isConnecting: boolean;
  isLoading: boolean;
  companyLoading: boolean;
}

export const WhatsAppWebSectionHeader = ({
  onConnect,
  isConnecting,
  isLoading,
  companyLoading
}: WhatsAppWebSectionHeaderProps) => {
  const isDisabled = isConnecting || isLoading || companyLoading;

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-900">
                WhatsApp Web.js (CORREÇÃO ROBUSTA)
              </CardTitle>
              <p className="text-sm text-green-700 mt-1">
                Gerencie suas conexões WhatsApp - Modal automático ativo
              </p>
            </div>
          </div>
          
          <Button
            onClick={onConnect}
            disabled={isDisabled}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConnecting ? 'Criando & Preparando QR...' : 'Conectando...'}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Conectar WhatsApp
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-green-100/50 rounded-lg p-3 border border-green-200">
          <p className="text-xs text-green-800">
            <strong>NOVO:</strong> O modal QR Code agora abre automaticamente após criar a instância. 
            Se demorar, aguarde alguns segundos ou use o botão "Ver QR" manualmente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
