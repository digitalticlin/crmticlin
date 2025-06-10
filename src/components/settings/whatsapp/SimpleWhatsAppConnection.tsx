
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

  // CORREÇÃO: Criar instância APENAS via Edge Function
  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    setIsConnecting(true);
    try {
      console.log('[Simple Connection] 🎯 CORREÇÃO: Criando instância via Edge Function para:', user.email);
      
      const result = await createInstance(); // CORREÇÃO: vai usar Edge Function apenas
      
      if (result && result.success && result.instance) {
        console.log('[Simple Connection] ✅ CORREÇÃO: Instância criada via Edge Function');
        toast.success(`Instância criada com sucesso via Edge Function!`);
      } else {
        console.log('[Simple Connection] ⚠️ CORREÇÃO: Resultado inesperado:', result);
      }
    } catch (error: any) {
      console.error('[Simple Connection] ❌ CORREÇÃO: Erro na Edge Function:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 CORREÇÃO: Geração manual de QR Code via Edge Function:', { instanceId, instanceName });
    
    setSelectedInstanceId(instanceId);
    setSelectedInstanceName(instanceName);
    setSelectedQRCode(null);
    setIsWaitingForQR(false);
    setShowQRModal(true);
    
    toast.info(`Modal aberto para ${instanceName}. Clique em "Gerar QR Code" para iniciar.`);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[Simple Connection] 🗑️ CORREÇÃO: Deletando via Edge Function:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Simple Connection] 🔄 CORREÇÃO: Refresh QR Code via Edge Function whatsapp_qr_service:', instanceId);
      
      const result = await refreshQRCode(instanceId);
      
      console.log('[Simple Connection] 📥 CORREÇÃO: Resultado:', result);
      
      if (result.success && result.qrCode) {
        console.log('[Simple Connection] ✅ CORREÇÃO: QR Code obtido via Edge Function!');
        setSelectedQRCode(result.qrCode);
        setIsWaitingForQR(false);
        return { success: true, qrCode: result.qrCode };
      }
      
      if (result.waiting) {
        console.log('[Simple Connection] ⏳ CORREÇÃO: QR Code ainda não disponível');
        return { success: false, waiting: true };
      }
      
      console.log('[Simple Connection] ❌ CORREÇÃO: Falha na busca:', result.error);
      return { success: false, error: result.error };
      
    } catch (error: any) {
      console.error('[Simple Connection] ❌ CORREÇÃO: Erro ao buscar QR Code:', error);
      return { success: false, error: error.message };
    }
  };

  const closeQRModal = () => {
    console.log('[Simple Connection] 🧹 CORREÇÃO: Fechando modal');
    
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

      {/* Card informativo sobre correção aplicada */}
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-green-800 space-y-2">
            <p><strong>✅ CORREÇÃO APLICADA:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Chamadas Diretas VPS:</strong> REMOVIDAS completamente</li>
              <li><strong>Edge Function Apenas:</strong> whatsapp_instance_manager para criação</li>
              <li><strong>QR Code via Edge Function:</strong> whatsapp_qr_service apenas</li>
              <li><strong>Logs Corrigidos:</strong> Agora mostram "Edge Function" nos logs</li>
              <li><strong>Fallback Removido:</strong> Sem bypass para VPS direto</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-green-200">
              <p className="font-medium">🎯 Fluxo CORRIGIDO:</p>
              <p>Frontend → Edge Function → VPS (nunca Frontend → VPS direto)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
