
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw } from "lucide-react";

interface WhatsAppPanelHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const WhatsAppPanelHeader = ({ onRefresh, isRefreshing }: WhatsAppPanelHeaderProps) => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800">
                WhatsApp & Instâncias Manager
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Gerenciamento completo de instâncias WhatsApp e detecção de órfãs
              </p>
            </div>
          </div>
          <Button 
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
