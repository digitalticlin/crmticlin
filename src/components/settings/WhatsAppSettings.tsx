
import { useState, useEffect } from "react";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import WhatsAppInstanceCard from "./whatsapp/WhatsAppInstanceCard";
import PlaceholderInstanceCard from "./whatsapp/PlaceholderInstanceCard";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";

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
      
      <WhatsAppInfoAlert />
      
      <div className="grid gap-4 sm:grid-cols-2">
        {instances.map(instance => (
          <WhatsAppInstanceCard 
            key={instance.id}
            instance={instance}
            isLoading={isLoading[instance.id] || false}
            showQrCode={showQrCode}
            onConnect={handleConnect}
            onDelete={handleDelete}
            onRefreshQrCode={handleRefreshQrCode}
          />
        ))}
        
        {/* Placeholder para adicional instância em planos superiores */}
        <PlaceholderInstanceCard />
      </div>
    </div>
  );
};

export default WhatsAppSettings;
