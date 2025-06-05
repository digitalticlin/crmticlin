
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                WhatsApp Web.js
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas conexões WhatsApp
              </p>
            </div>
          </div>
          
          <Button
            onClick={onConnect}
            disabled={isDisabled}
            className="bg-green-600 hover:bg-green-700 text-white"
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
        </div>
      </CardHeader>
    </Card>
  );
};
