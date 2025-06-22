
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { SimpleInstanceCard } from "./SimpleInstanceCard";
import { QRCodeModal } from "@/modules/whatsapp/instanceCreation/components/QRCodeModal";
import { ConnectionCard } from "./connection/ConnectionCard";
import { AddNewConnectionCard } from "./connection/AddNewConnectionCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useInstanceCreation } from "@/modules/whatsapp/instanceCreation/hooks/useInstanceCreation";
import { useQRCodeModal } from "@/modules/whatsapp/instanceCreation/hooks/useQRCodeModal";

export const SimpleWhatsAppConnection = () => {
  const { user } = useAuth();
  const [lastInstanceCount, setLastInstanceCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    instances,
    isLoading,
    deleteInstance,
    loadInstances
  } = useWhatsAppWebInstances();

  const { createInstance, isCreating } = useInstanceCreation(loadInstances);
  const { openModal } = useQRCodeModal();

  // CORREÇÃO: Inicializar contador apenas uma vez
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      setLastInstanceCount(instances.length);
      setIsInitialized(true);
      console.log('[Simple Connection] 🔄 Inicializado com', instances.length, 'instâncias');
    }
  }, [instances.length, isLoading, isInitialized]);

  // CORREÇÃO: Detectar QUALQUER nova instância (inclusive a primeira)
  useEffect(() => {
    if (!isInitialized) return;

    if (instances.length > lastInstanceCount) {
      const newInstance = instances[instances.length - 1];
      console.log('[Simple Connection] 🎯 NOVA INSTÂNCIA DETECTADA:', newInstance.id);
      console.log('[Simple Connection] 🚀 Abrindo modal IMEDIATO para nova instância');
      
      // CORREÇÃO: Delay mínimo para garantir que a instância esteja totalmente criada
      setTimeout(() => {
        openModal(newInstance.id);
      }, 100);
    }
    
    setLastInstanceCount(instances.length);
  }, [instances.length, lastInstanceCount, openModal, isInitialized]);

  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    console.log('[Simple Connection] 🎯 Criando instância para:', user.email);
    await createInstance();
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 CORREÇÃO: Abrindo modal IMEDIATO para:', { instanceId, instanceName });
    openModal(instanceId);
  };

  const handleDeleteInstance = async () => {
    console.log('[Simple Connection] 🗑️ Callback de deleção executado');
    await loadInstances();
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
        <ConnectionCard onConnect={handleConnect} isConnecting={isCreating} />
        <QRCodeModal />
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
          />
        ))}
        
        <AddNewConnectionCard onConnect={handleConnect} isConnecting={isCreating} />
      </div>

      <QRCodeModal />
    </div>
  );
};
