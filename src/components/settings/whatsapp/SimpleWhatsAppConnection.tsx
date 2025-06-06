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
      <Card className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-700 font-medium">Carregando suas conexões WhatsApp...</p>
        </CardContent>
      </Card>
    );
  }

  // Show simple connect card when no instances
  if (instances.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50/80 to-green-100/60 
          backdrop-blur-xl border-2 border-dashed border-green-300/70 rounded-3xl 
          hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          
          <CardContent className="p-10 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
              bg-gradient-to-br from-green-400/30 to-green-600/30 backdrop-blur-sm mb-6
              ring-4 ring-green-200/50">
              <MessageSquare className="h-10 w-10 text-green-600" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Conectar WhatsApp</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Conecte sua conta WhatsApp para começar a enviar e receber mensagens 
              de forma integrada com seu sistema
            </p>
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl 
                transition-all duration-200 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 mr-3" />
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Existing instances */}
        {instances.map((instance) => (
          <SimpleInstanceCard
            key={instance.id}
            instance={instance}
            onGenerateQR={() => handleGenerateQR(instance.id, instance.instance_name)}
          />
        ))}
        
        {/* Add new connection card */}
        <Card className="group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
          bg-gradient-to-br from-green-50/60 to-green-100/40 backdrop-blur-xl 
          border-2 border-dashed border-green-300/70 rounded-2xl overflow-hidden
          cursor-pointer" 
          onClick={!isConnecting ? handleConnect : undefined}>
          
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <CardContent className="p-6 text-center flex flex-col justify-center h-full min-h-[240px] relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
              bg-gradient-to-br from-green-400/30 to-green-600/30 backdrop-blur-sm mb-4
              group-hover:scale-110 transition-transform duration-200">
              {isConnecting ? (
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              ) : (
                <Plus className="h-8 w-8 text-green-600" />
              )}
            </div>
            
            <h3 className="font-semibold text-gray-800 mb-2">Nova Conexão</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Conecte mais uma conta WhatsApp
            </p>
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
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
