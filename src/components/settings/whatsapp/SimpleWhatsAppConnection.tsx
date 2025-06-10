
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "./QRCodeModal";
import { ConnectionCard } from "./connection/ConnectionCard";
import { AddNewConnectionCard } from "./connection/AddNewConnectionCard";
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
    refreshQRCode
  } = useWhatsAppWebInstances();

  // FASE 2: Criar instância sem parâmetros - nome gerado internamente
  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    setIsConnecting(true);
    try {
      console.log('[Simple Connection] 🎯 FASE 2: Criando instância com nome inteligente baseado em:', user.email);
      
      const result = await createInstance(); // CORREÇÃO: sem parâmetros
      
      // FASE 2: Correção TypeScript - verificar se result tem a propriedade instance
      if (result && 'instance' in result && result.instance) {
        const instanceData = result.instance;
        
        console.log('[Simple Connection] ✅ FASE 2: Instância criada com sucesso');
        toast.success(`Instância criada com sucesso!`);
        
        console.log('[Simple Connection] ⏳ Aguardando webhook ou ação manual do usuário');
      } else {
        console.log('[Simple Connection] ⚠️ FASE 2: Resultado inesperado:', result);
      }
    } catch (error: any) {
      console.error('[Simple Connection] ❌ FASE 2: Erro:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 FASE 2: Geração manual de QR Code:', { instanceId, instanceName });
    
    setSelectedInstanceId(instanceId);
    setSelectedInstanceName(instanceName);
    setSelectedQRCode(null);
    setIsWaitingForQR(false);
    setShowQRModal(true);
    
    toast.info(`Modal aberto para ${instanceName}. Clique em "Gerar QR Code" para iniciar.`);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteInstance(instanceId);
  };

  const handleRefreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Simple Connection] 🔄 FASE 2: Refresh QR Code:', instanceId);
      
      const { ImprovedQRService } = await import('@/services/whatsapp/improvedQRService');
      const result = await ImprovedQRService.getQRCodeWithDetails(instanceId);
      
      console.log('[Simple Connection] 📥 FASE 2: Resultado:', result);
      
      if (result.success && result.qrCode) {
        console.log('[Simple Connection] ✅ FASE 2: QR Code obtido!');
        setSelectedQRCode(result.qrCode);
        setIsWaitingForQR(false);
        return { success: true, qrCode: result.qrCode };
      }
      
      if (result.waiting) {
        console.log('[Simple Connection] ⏳ FASE 2: QR Code ainda não disponível');
        return { success: false, waiting: true };
      }
      
      console.log('[Simple Connection] ❌ FASE 2: Falha na busca:', result.error);
      return { success: false, error: result.error };
      
    } catch (error: any) {
      console.error('[Simple Connection] ❌ FASE 2: Erro ao buscar QR Code:', error);
      return { success: false, error: error.message };
    }
  };

  const closeQRModal = () => {
    console.log('[Simple Connection] 🧹 FASE 2: Fechando modal');
    
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
