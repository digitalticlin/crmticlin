
import { useState } from "react";
import { QrCode, Trash2, RefreshCw, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/useWhatsAppInstances";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  isLoading: boolean;
  showQrCode: string | null;
  onConnect: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
  onRefreshQrCode: (instanceId: string) => void;
}

const WhatsAppInstanceCard = ({
  instance,
  isLoading,
  showQrCode,
  onConnect,
  onDelete,
  onRefreshQrCode
}: WhatsAppInstanceCardProps) => {
  return (
    <Card className="overflow-hidden glass-card border-0">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-medium">WhatsApp</h4>
              <p className="text-sm text-muted-foreground">Instância: {instance.instanceName}</p>
            </div>
            <Badge variant="outline" className={instance.connected ? 
              "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
              "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
              {instance.connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          
          {showQrCode === instance.id && instance.qrCodeUrl && (
            <div className="flex justify-center mb-4 p-4 bg-white dark:bg-black rounded-md">
              <img 
                src={instance.qrCodeUrl} 
                alt="QR Code para conexão do WhatsApp" 
                className="w-48 h-48"
              />
            </div>
          )}
          
          <div className="flex gap-2">
            {!instance.connected ? (
              <>
                <Button 
                  variant="whatsapp" 
                  className="flex-1"
                  onClick={() => onConnect(instance.id)}
                  disabled={isLoading}
                >
                  {instance.qrCodeUrl ? (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      {isLoading ? "Gerando QR..." : "Mostrar QR Code"}
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      {isLoading ? "Conectando..." : "Conectar WhatsApp"}
                    </>
                  )}
                </Button>
                
                {instance.qrCodeUrl && (
                  <Button 
                    variant="outline" 
                    onClick={() => onRefreshQrCode(instance.id)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Gerando..." : "Gerar novo QR Code"}
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => onDelete(instance.id)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading ? "Desconectando..." : "Deletar WhatsApp"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceCard;
