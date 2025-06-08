import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "./QRCodeModal";
import { ConnectionCard } from "./connection/ConnectionCard";
import { AddNewConnectionCard } from "./connection/AddNewConnectionCard";
import { AutoQRPolling } from "./connection/AutoQRPolling";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SimpleWhatsAppConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

  const { user } = useAuth();
  
  const {
    instances,
    isLoading,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    setIsConnecting(true);
    try {
      const intelligentName = await generateIntelligentInstanceName(user.email);
      console.log('[Simple Connection] 🎯 FLUXO AUTOMÁTICO v3.0: Iniciando conexão:', intelligentName);
      
      // PASSO 1: Criar instância via whatsapp_instance_manager
      const createdInstanceResponse = await createInstance(intelligentName);
      
      if (createdInstanceResponse && createdInstanceResponse.instance) {
        const instanceData = createdInstanceResponse.instance;
        
        // PASSO 2: ABRIR MODAL IMEDIATAMENTE em estado "Aguardando QR Code"
        setSelectedInstanceId(instanceData.id);
        setSelectedInstanceName(instanceData.instance_name);
        setSelectedQRCode(null);
        setIsWaitingForQR(true);
        setShowQRModal(true);
        
        console.log('[Simple Connection] 🔄 FLUXO AUTOMÁTICO v3.0: Modal aberto, polling agressivo será iniciado automaticamente');
        toast.success(`Instância "${intelligentName}" criada! Iniciando busca agressiva por QR Code...`);
      }
    } catch (error: any) {
      console.error('[Simple Connection] ❌ Erro no fluxo automático v3.0:', error);
      setShowQRModal(false);
      setIsWaitingForQR(false);
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 Geração manual de QR Code v3.0:', { instanceId, instanceName });
    
    setSelectedInstanceId(instanceId);
    setSelectedInstanceName(instanceName);
    setSelectedQRCode(null);
    setIsWaitingForQR(true);
    setShowQRModal(true);
    
    console.log('[Simple Connection] 🚀 Modal aberto, polling agressivo será iniciado automaticamente');
    toast.info(`Iniciando busca agressiva por QR Code para ${instanceName}...`);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteInstance(instanceId);
  };

  const handleRefreshQRCode = async (instanceId: string): Promise<{ qrCode?: string } | null> => {
    try {
      console.log('[Simple Connection] 🔄 Refresh QR Code via whatsapp_qr_service:', instanceId);
      const result = await refreshQRCode(instanceId);
      
      if (result?.success && result.qrCode) {
        console.log('[Simple Connection] ✅ QR Code atualizado via whatsapp_qr_service');
        setSelectedQRCode(result.qrCode);
        setIsWaitingForQR(false);
        return { qrCode: result.qrCode };
      }
      
      console.log('[Simple Connection] ⏳ QR Code ainda não disponível');
      return null;
    } catch (error: any) {
      console.error('[Simple Connection] ❌ Erro ao atualizar QR Code:', error);
      return null;
    }
  };

  const closeQRModal = () => {
    console.log('[Simple Connection] 🧹 Fechando modal QR');
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
    setSelectedInstanceId('');
    setIsWaitingForQR(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-700 font-medium">Carregando suas conexões WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <ConnectionCard onConnect={handleConnect} isConnecting={isConnecting} />

        <QRCodeModal
          isOpen={showQRModal}
          onClose={closeQRModal}
          qrCode={selectedQRCode}
          instanceName={selectedInstanceName}
          instanceId={selectedInstanceId}
          onRefreshQRCode={handleRefreshQRCode}
          isWaitingForQR={isWaitingForQR}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
          <SimpleInstanceCard
            key={instance.id}
            instance={instance}
            onGenerateQR={handleGenerateQR}
            onDelete={handleDeleteInstance}
            onRefreshQRCode={handleRefreshQRCode}
          />
        ))}
        
        <AddNewConnectionCard onConnect={handleConnect} isConnecting={isConnecting} />
      </div>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
        instanceId={selectedInstanceId}
        onRefreshQRCode={handleRefreshQRCode}
        isWaitingForQR={isWaitingForQR}
      />
    </div>
  );
};
