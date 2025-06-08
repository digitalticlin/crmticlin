import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Plus } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "./QRCodeModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const SimpleWhatsAppConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');

  const { user } = useAuth();
  
  const {
    instances,
    isLoading,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  // Polling automático para QR Code após criação da instância  
  const startAutoQRPolling = async (instanceId: string, instanceName: string) => {
    console.log('[Auto QR] 🚀 Iniciando polling automático para:', instanceName);
    
    let attempts = 0;
    const maxAttempts = 30; // 90 segundos (3s * 30)
    
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`[Auto QR] 📡 Tentativa ${attempts}/${maxAttempts} para ${instanceName}`);
      
      try {
        const result = await refreshQRCode(instanceId);
        
        if (result?.success && result.qrCode) {
          console.log('[Auto QR] ✅ QR Code obtido automaticamente!');
          
          // Abrir modal automaticamente
          setSelectedInstanceId(instanceId);
          setSelectedInstanceName(instanceName);
          setSelectedQRCode(result.qrCode);
          setShowQRModal(true);
          
          // Parar polling
          clearInterval(pollInterval);
          
          toast.success(`QR Code pronto para "${instanceName}"! Escaneie para conectar.`);
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log('[Auto QR] ⏰ Timeout do polling automático');
          clearInterval(pollInterval);
          toast.warning(`QR Code não gerado automaticamente para "${instanceName}". Tente gerar manualmente.`);
        }
        
      } catch (error: any) {
        console.error('[Auto QR] ❌ Erro no polling:', error);
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          toast.error(`Erro no polling automático: ${error.message}`);
        }
      }
    }, 3000); // 3 segundos entre tentativas
  };

  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    setIsConnecting(true);
    try {
      const intelligentName = await generateIntelligentInstanceName(user.email);
      console.log('[Simple Connection] 🎯 Creating instance with intelligent name:', intelligentName);
      
      const createdInstanceResponse = await createInstance(intelligentName);
      
      // CORREÇÃO: Acessar as propriedades através do objeto instance
      if (createdInstanceResponse && createdInstanceResponse.instance) {
        const instanceData = createdInstanceResponse.instance;
        toast.success(`Instância "${intelligentName}" criada! Aguardando QR Code automático...`);
        
        // Iniciar polling automático para QR Code
        setTimeout(() => {
          startAutoQRPolling(instanceData.id, instanceData.instance_name);
        }, 8000); // Aguardar 8s para VPS estar pronta
      }
    } catch (error: any) {
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 Gerando QR Code manual para:', { instanceId, instanceName });
    
    // Abrir modal imediatamente
    setSelectedInstanceId(instanceId);
    setSelectedInstanceName(instanceName);
    setSelectedQRCode(null);
    setShowQRModal(true);
    
    // Tentar buscar QR Code existente primeiro
    try {
      const result = await refreshQRCode(instanceId);
      if (result?.success && result.qrCode) {
        setSelectedQRCode(result.qrCode);
        toast.success('QR Code carregado!');
      }
    } catch (error: any) {
      console.error('[Simple Connection] ❌ Erro ao buscar QR Code:', error);
      toast.error(`Erro ao carregar QR Code: ${error.message}`);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteInstance(instanceId);
  };

  const handleRefreshQRCode = async (instanceId: string): Promise<{ qrCode?: string } | null> => {
    try {
      console.log('[Simple Connection] 🔄 Refresh QR Code:', instanceId);
      const result = await refreshQRCode(instanceId);
      
      if (result?.success && result.qrCode) {
        console.log('[Simple Connection] ✅ QR Code obtido:', result.qrCode.substring(0, 50) + '...');
        setSelectedQRCode(result.qrCode);
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
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50/80 to-green-100/60 
          backdrop-blur-xl border-2 border-dashed border-green-300/70 rounded-3xl 
          hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          
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
              de forma integrada com seu sistema. O QR Code será gerado automaticamente!
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
                  Conectando e preparando QR...
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5 mr-3" />
                  Conectar WhatsApp (Automático)
                </>
              )}
            </Button>
            
            {isConnecting && (
              <p className="text-sm text-gray-500 mt-4">
                O QR Code aparecerá automaticamente quando estiver pronto
              </p>
            )}
          </CardContent>
        </Card>

        <QRCodeModal
          isOpen={showQRModal}
          onClose={closeQRModal}
          qrCode={selectedQRCode}
          instanceName={selectedInstanceName}
          instanceId={selectedInstanceId}
          onRefreshQRCode={handleRefreshQRCode}
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
        
        <Card className="group relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
          bg-gradient-to-br from-green-50/60 to-green-100/40 backdrop-blur-xl 
          border-2 border-dashed border-green-300/70 rounded-2xl overflow-hidden
          cursor-pointer min-h-[280px] flex items-center justify-center" 
          onClick={!isConnecting ? handleConnect : undefined}>
          
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <CardContent className="p-6 text-center relative z-10">
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
              Conecte mais uma conta WhatsApp com QR automático
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
                  Conectar (Auto QR)
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
        instanceId={selectedInstanceId}
        onRefreshQRCode={handleRefreshQRCode}
      />
    </div>
  );
};
