
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Trash2, RefreshCw, Link, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const WhatsAppSettings = () => {
  // Usuário atual (mock - em uma aplicação real viria do contexto de autenticação)
  const currentUserEmail = "digitalticlin@gmail.com";
  
  const {
    instances,
    isLoading,
    instanceName,
    connectInstance,
    deleteInstance,
    refreshQrCode
  } = useWhatsAppInstances(currentUserEmail);
  
  const [showQrCode, setShowQrCode] = useState<string | null>(null);

  // Mostrar automaticamente o QR code quando estiver disponível
  useEffect(() => {
    const instanceWithQr = instances.find(instance => instance.qrCodeUrl);
    if (instanceWithQr) {
      setShowQrCode(instanceWithQr.id);
    }
  }, [instances]);

  const handleConnect = async (instanceId: string) => {
    try {
      await connectInstance(instanceId);
      setShowQrCode(instanceId);
    } catch (error) {
      console.error("Erro ao conectar:", error);
    }
  };

  const handleDelete = async (instanceId: string) => {
    try {
      await deleteInstance(instanceId);
      setShowQrCode(null);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleRefreshQrCode = async (instanceId: string) => {
    try {
      await refreshQrCode(instanceId);
      setShowQrCode(instanceId);
    } catch (error) {
      console.error("Erro ao atualizar QR code:", error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-xl font-semibold">Gerenciamento de WhatsApp</h3>
        <p className="text-sm text-muted-foreground">
          Conecte e gerencie suas instâncias de WhatsApp
        </p>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Para conectar seu WhatsApp, escaneie o QR code com seu aplicativo WhatsApp. 
          O QR code expira após alguns minutos. Se expirar, clique em "Gerar novo QR Code".
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {instances.map(instance => (
          <Card key={instance.id} className="overflow-hidden glass-card border-0">
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
                        onClick={() => handleConnect(instance.id)}
                        disabled={isLoading[instance.id]}
                      >
                        {instance.qrCodeUrl ? (
                          <>
                            <QrCode className="w-4 h-4 mr-2" />
                            {isLoading[instance.id] ? "Gerando QR..." : "Mostrar QR Code"}
                          </>
                        ) : (
                          <>
                            <Link className="w-4 h-4 mr-2" />
                            {isLoading[instance.id] ? "Conectando..." : "Conectar WhatsApp"}
                          </>
                        )}
                      </Button>
                      
                      {instance.qrCodeUrl && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleRefreshQrCode(instance.id)}
                          disabled={isLoading[instance.id]}
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoading[instance.id] ? "animate-spin" : ""}`} />
                          {isLoading[instance.id] ? "Gerando..." : "Gerar novo QR Code"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleDelete(instance.id)}
                      disabled={isLoading[instance.id]}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isLoading[instance.id] ? "Desconectando..." : "Deletar WhatsApp"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Placeholder para adicional instância em planos superiores */}
        <Card className="overflow-hidden glass-card border-0 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <QrCode className="w-8 h-8 text-gray-400 mb-2" />
            <h4 className="font-medium">Adicional WhatsApp</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Disponível em planos superiores
            </p>
            <Button variant="outline" disabled>Upgrade de Plano</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
