import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Plus } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "./QRCodeModal";
import { useAuth } from "@/contexts/AuthContext";

export const SimpleWhatsAppConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  const { user } = useAuth();
  
  const {
    instances,
    isLoading,
    createInstance,
    refreshQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  const handleConnect = async () => {
    if (!user?.email) {
      console.error('User email not available');
      return;
    }

    setIsConnecting(true);
    try {
      // Generate intelligent instance name based on user email
      const intelligentName = await generateIntelligentInstanceName(user.email);
      console.log('[Simple Connection] 🎯 Creating instance with intelligent name:', intelligentName);
      
      await createInstance(intelligentName);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    const result = await refreshQRCode(instanceId);
    if (result?.qrCode) {
      setSelectedQRCode(result.qrCode);
      setSelectedInstanceName(instanceName);
      setShowQRModal(true);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando suas conexões WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  // Show simple connect card when no instances
  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-dashed border-green-300 bg-green-50/30">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-green-100 rounded-full inline-block mb-4">
              <MessageSquare className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Conectar WhatsApp</h3>
            <p className="text-gray-600 mb-6">
              Conecte sua conta WhatsApp para começar a enviar e receber mensagens
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Conectar WhatsApp
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <QRCodeModal
          isOpen={showQRModal}
          onClose={closeQRModal}
          qrCode={selectedQRCode}
          instanceName={selectedInstanceName}
        />
      </div>
    );
  }

  // Show grid layout when instances exist
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Existing instances */}
        {instances.map((instance) => (
          <SimpleInstanceCard
            key={instance.id}
            instance={instance}
            onGenerateQR={() => handleGenerateQR(instance.id, instance.instance_name)}
          />
        ))}
        
        {/* Add new connection card */}
        <Card className="border-2 border-dashed border-green-300 bg-green-50/30 hover:bg-green-50/50 transition-colors">
          <CardContent className="p-6 text-center flex flex-col justify-center min-h-[200px]">
            <div className="p-3 bg-green-100 rounded-full inline-block mb-3">
              <Plus className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-medium mb-2">Nova Conexão</h3>
            <p className="text-sm text-gray-600 mb-4">
              Conecte mais uma conta WhatsApp
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <QRCodeModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
      />
    </div>
  );
};
