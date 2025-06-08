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

  // CORREÇÃO: Controle único do AutoQRPolling
  const [autoPolling, setAutoPolling] = useState<AutoQRPolling | null>(null);

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

    // Parar polling anterior se existir
    if (autoPolling) {
      autoPolling.stop();
      setAutoPolling(null);
    }

    setIsConnecting(true);
    try {
      const intelligentName = await generateIntelligentInstanceName(user.email);
      console.log('[Simple Connection] 🎯 Criando instância:', intelligentName);
      
      const createdInstanceResponse = await createInstance(intelligentName);
      
      if (createdInstanceResponse && createdInstanceResponse.instance) {
        const instanceData = createdInstanceResponse.instance;
        
        // Abrir modal primeiro
        setSelectedInstanceId(instanceData.id);
        setSelectedInstanceName(instanceData.instance_name);
        setSelectedQRCode(null);
        setIsWaitingForQR(true);
        setShowQRModal(true);
        
        // CORREÇÃO: Criar novo AutoQRPolling controlado
        const newAutoPolling = new AutoQRPolling(
          instanceData.id,
          instanceData.instance_name,
          handleRefreshQRCode,
          (qrCode: string) => {
            setSelectedQRCode(qrCode);
            setIsWaitingForQR(false);
          }
        );
        
        setAutoPolling(newAutoPolling);
        newAutoPolling.start(3000); // Delay de 3 segundos
        
        console.log('[Simple Connection] ✅ Instância criada, polling iniciado');
        toast.success(`Instância "${intelligentName}" criada! Aguardando QR Code...`);
      }
    } catch (error: any) {
      console.error('[Simple Connection] ❌ Erro:', error);
      setShowQRModal(false);
      setIsWaitingForQR(false);
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 Geração manual de QR Code:', { instanceId, instanceName });
    
    // Parar polling anterior
    if (autoPolling) {
      autoPolling.stop();
      setAutoPolling(null);
    }
    
    setSelectedInstanceId(instanceId);
    setSelectedInstanceName(instanceName);
    setSelectedQRCode(null);
    setIsWaitingForQR(true);
    setShowQRModal(true);
    
    toast.info(`Gerando QR Code para ${instanceName}...`);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    // Parar polling se deletando instância ativa
    if (autoPolling && selectedInstanceId === instanceId) {
      autoPolling.stop();
      setAutoPolling(null);
    }
    
    await deleteInstance(instanceId);
  };

  const handleRefreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Simple Connection] 🔄 Refresh QR Code:', instanceId);
      
      const { ImprovedQRService } = await import('@/services/whatsapp/improvedQRService');
      const result = await ImprovedQRService.getQRCodeWithDetails(instanceId);
      
      console.log('[Simple Connection] 📥 Resultado:', result);
      
      if (result.success && result.qrCode) {
        console.log('[Simple Connection] ✅ QR Code obtido!');
        setSelectedQRCode(result.qrCode);
        setIsWaitingForQR(false);
        return { success: true, qrCode: result.qrCode };
      }
      
      if (result.waiting) {
        console.log('[Simple Connection] ⏳ QR Code ainda não disponível');
        return { success: false, waiting: true };
      }
      
      console.log('[Simple Connection] ❌ Falha na busca:', result.error);
      return { success: false, error: result.error };
      
    } catch (error: any) {
      console.error('[Simple Connection] ❌ Erro ao buscar QR Code:', error);
      return { success: false, error: error.message };
    }
  };

  const closeQRModal = () => {
    console.log('[Simple Connection] 🧹 Fechando modal e parando polling');
    
    // Parar polling ao fechar modal
    if (autoPolling) {
      autoPolling.stop();
      setAutoPolling(null);
    }
    
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
