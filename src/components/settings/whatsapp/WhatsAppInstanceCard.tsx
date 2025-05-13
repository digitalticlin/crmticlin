
import { useState, useEffect } from "react";
import { QrCode, Trash2, RefreshCw, Link, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  isLoading: boolean;
  showQrCode: string | null;
  onConnect: (instanceId: string) => Promise<void>;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQrCode: (instanceId: string) => Promise<void>;
}

const WhatsAppInstanceCard = ({
  instance,
  isLoading,
  showQrCode,
  onConnect,
  onDelete,
  onRefreshQrCode
}: WhatsAppInstanceCardProps) => {
  // Estado local para rastrear quando o QR code foi obtido com sucesso
  const [qrCodeSuccess, setQrCodeSuccess] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Detecta quando um QR code é recebido para mostrar automaticamente
  useEffect(() => {
    if (instance.qrCodeUrl && !qrCodeSuccess) {
      console.log(`QR Code recebido para instância ${instance.id}: ${instance.instanceName}`);
      console.log("QR code URL existe:", !!instance.qrCodeUrl);
      console.log("QR code URL (primeiros 50 caracteres):", 
        instance.qrCodeUrl ? instance.qrCodeUrl.substring(0, 50) : "NULO");
      setQrCodeSuccess(true);
    }
  }, [instance.qrCodeUrl, qrCodeSuccess, instance.id, instance.instanceName]);

  // Função de clique para conectar o WhatsApp
  const handleConnect = async () => {
    try {
      console.log(`Iniciando conexão para instância ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onConnect(instance.id);
      console.log(`Conexão iniciada para ${instance.instanceName}`);
    } catch (error) {
      console.error("Erro ao conectar:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Função para atualizar o QR code
  const handleRefreshQrCode = async () => {
    try {
      console.log(`Atualizando QR code para instância ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onRefreshQrCode(instance.id);
      console.log(`QR code atualizado para ${instance.instanceName}`);
    } catch (error) {
      console.error("Erro ao atualizar QR code:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Função para deletar o número de WhatsApp
  const handleDelete = async () => {
    try {
      console.log(`Deletando instância ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      await onDelete(instance.id);
      console.log(`Instância ${instance.instanceName} deletada`);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Determinar se deve mostrar o QR code (quando está disponível e mostrado)
  const shouldShowQrCode = (showQrCode === instance.id || qrCodeSuccess) && instance.qrCodeUrl;

  return (
    <Card className="overflow-hidden glass-card border-0">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-medium">WhatsApp</h4>
              <p className="text-sm text-muted-foreground">Instância: {instance.instanceName}</p>
              {instance.connected && instance.phoneNumber && (
                <div className="flex items-center mt-1 gap-1 text-green-600 dark:text-green-400">
                  <Phone className="w-3 h-3" />
                  <p className="text-xs font-medium">{instance.phoneNumber}</p>
                </div>
              )}
            </div>
            <Badge variant="outline" className={instance.connected ? 
              "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
              "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
              {instance.connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          
          {instance.connected && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-400">
                WhatsApp conectado com sucesso. Você pode agora gerenciar suas conversas na página de chats.
              </p>
            </div>
          )}
          
          {shouldShowQrCode && instance.qrCodeUrl && (
            <div className="flex flex-col items-center mb-4 p-4 bg-white dark:bg-black rounded-md">
              <img 
                src={instance.qrCodeUrl} 
                alt="QR Code para conexão do WhatsApp" 
                className="w-48 h-48"
              />
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Escaneie o QR code com seu aplicativo WhatsApp. O QR code expira após alguns minutos.
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {!instance.connected ? (
              <>
                <Button 
                  variant="whatsapp" 
                  className="flex-1"
                  onClick={handleConnect}
                  disabled={isLoading || actionInProgress}
                >
                  {instance.qrCodeUrl ? (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      {isLoading || actionInProgress ? "Gerando QR..." : "Mostrar QR Code"}
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      {isLoading || actionInProgress ? "Conectando..." : "Conectar WhatsApp"}
                    </>
                  )}
                </Button>
                
                {instance.qrCodeUrl && (
                  <Button 
                    variant="outline" 
                    onClick={handleRefreshQrCode}
                    disabled={isLoading || actionInProgress}
                  >
                    <RefreshCw className={`w-4 h-4 ${(isLoading || actionInProgress) ? "animate-spin" : ""}`} />
                    <span className="ml-2 hidden sm:inline">
                      {isLoading || actionInProgress ? "Gerando..." : "Gerar novo QR Code"}
                    </span>
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleDelete}
                disabled={isLoading || actionInProgress}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading || actionInProgress ? "Desconectando..." : "Desconectar WhatsApp"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceCard;
