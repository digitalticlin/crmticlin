
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
import { supabase } from "@/integrations/supabase/client";

export const SimpleWhatsAppConnection = () => {
  const { user } = useAuth();
  const [lastInstanceCount, setLastInstanceCount] = useState(0);
  
  const {
    instances,
    isLoading,
    deleteInstance,
    loadInstances
  } = useWhatsAppWebInstances();

  const { createInstance, isCreating } = useInstanceCreation(loadInstances);
  const { 
    isOpen: showQRModal,
    qrCode: selectedQRCode,
    instanceId: selectedInstanceId,
    isLoading: isWaitingForQR,
    error: qrError,
    openModal,
    closeModal
  } = useQRCodeModal();

  // Detectar nova instância criada e abrir modal automaticamente
  useEffect(() => {
    if (instances.length > lastInstanceCount && lastInstanceCount > 0) {
      const newInstance = instances[instances.length - 1];
      console.log('[Simple Connection] 🎯 Nova instância detectada:', newInstance.id);
      
      // Aguardar um pouco para garantir que a instância foi salva
      setTimeout(() => {
        console.log('[Simple Connection] 🚀 Abrindo modal para nova instância');
        openModal(newInstance.id);
      }, 1000);
    }
    setLastInstanceCount(instances.length);
  }, [instances.length, lastInstanceCount, openModal]);

  // Configurar subscription para detectar QR Code de novas instâncias
  useEffect(() => {
    if (!user?.email) return;

    const subscription = supabase
      .channel('new_instances_qr')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_instances',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        const updatedInstance = payload.new as any;
        
        // Se uma instância recém-criada recebeu QR Code
        if (updatedInstance.qr_code && !showQRModal) {
          const instanceAge = Date.now() - new Date(updatedInstance.created_at).getTime();
          const isRecentInstance = instanceAge < 30000; // 30 segundos
          
          if (isRecentInstance) {
            console.log('[Simple Connection] 📱 QR Code recebido para instância recente, abrindo modal');
            openModal(updatedInstance.id);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.email, user?.id, showQRModal, openModal]);

  const handleConnect = async () => {
    if (!user?.email) {
      toast.error('Email do usuário não disponível');
      return;
    }

    console.log('[Simple Connection] 🎯 Criando instância via módulo modular para:', user.email);
    await createInstance();
  };

  const handleGenerateQR = async (instanceId: string, instanceName: string) => {
    console.log('[Simple Connection] 🔄 Abrindo modal QR Code para:', { instanceId, instanceName });
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
