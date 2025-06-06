
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, QrCode, CheckCircle, AlertCircle } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "./QRCodeModal";

export const SimpleWhatsAppConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  const {
    instances,
    isLoading,
    createInstance,
    refreshQRCode
  } = useWhatsAppWebInstances();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const timestamp = Date.now();
      const instanceName = `WhatsApp_${timestamp}`;
      await createInstance(instanceName);
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

  const connectedInstances = instances.filter(i => 
    i.connection_status === 'connected' || 
    i.connection_status === 'ready' || 
    i.connection_status === 'open'
  );

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp</h2>
                <p className="text-sm text-green-600">
                  Conecte e gerencie suas contas WhatsApp
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Connect Button or Instance List */}
      {instances.length === 0 ? (
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
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Suas Conexões WhatsApp</h3>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              variant="outline"
              size="sm"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nova Conexão
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance) => (
              <SimpleInstanceCard
                key={instance.id}
                instance={instance}
                onGenerateQR={() => handleGenerateQR(instance.id, instance.instance_name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
      />
    </div>
  );
};
