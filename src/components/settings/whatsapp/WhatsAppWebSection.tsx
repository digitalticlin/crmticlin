
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useAutomaticQRPolling } from "@/hooks/whatsapp/useAutomaticQRPolling";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Component rendering');
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [localShowQRModal, setLocalShowQRModal] = useState(false);
  const [localSelectedQRCode, setLocalSelectedQRCode] = useState<string | null>(null);
  const [localSelectedInstanceName, setLocalSelectedInstanceName] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    isLoading,
    isConnecting,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  const { isPolling, startPolling, stopPolling } = useAutomaticQRPolling();

  // Load current user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
          toast.error("Could not load user data");
          return;
        }
        if (user) {
          setUserEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("An error occurred while loading user data");
      }
    };
    getUser();
  }, []);

  // Função principal de conexão com modal automático
  const handleConnect = async () => {
    console.log('[WhatsAppWebSection] 🚀 Connect requested');
    
    const instanceName = await generateIntelligentInstanceName(userEmail);
    console.log('[WhatsAppWebSection] 🎯 Nome gerado:', instanceName);
    
    try {
      console.log('[WhatsAppWebSection] 📱 Criando instância...');
      const createdInstance = await createInstance(instanceName);
      
      if (createdInstance) {
        setLocalSelectedInstanceName(createdInstance.instance_name);
        
        if (createdInstance.qr_code) {
          // QR Code disponível imediatamente - abrir modal
          console.log('[WhatsAppWebSection] ✅ QR Code imediato disponível!');
          setLocalSelectedQRCode(createdInstance.qr_code);
          setLocalShowQRModal(true);
          toast.success(`Instância "${instanceName}" criada! Escaneie o QR Code.`);
        } else {
          // QR Code não disponível - iniciar polling automático
          console.log('[WhatsAppWebSection] ⏳ Iniciando polling automático...');
          setIsWaitingForQR(true);
          
          toast.info(`Instância "${instanceName}" criada! Preparando QR Code...`);
          
          await startPolling(
            createdInstance.id,
            createdInstance.instance_name,
            (qrCode: string) => {
              console.log('[WhatsAppWebSection] 🎉 QR Code recebido - abrindo modal!');
              setLocalSelectedQRCode(qrCode);
              setLocalShowQRModal(true);
              setIsWaitingForQR(false);
              toast.success('QR Code pronto! Escaneie para conectar.');
            }
          );
        }
      }
    } catch (error) {
      console.error('[WhatsAppWebSection] ❌ Erro na criação:', error);
      setIsWaitingForQR(false);
      stopPolling();
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Refreshing QR code for instance:', instanceId);
    const result = await refreshQRCode(instanceId);
    
    if (result.success && result.qrCode) {
      const instance = instances.find(i => i.id === instanceId);
      setLocalSelectedQRCode(result.qrCode);
      setLocalSelectedInstanceName(instance?.instance_name || '');
      setLocalShowQRModal(true);
    }
  };

  const handleShowQR = (instance: any) => {
    if (instance.qr_code) {
      setLocalSelectedQRCode(instance.qr_code);
      setLocalSelectedInstanceName(instance.instance_name);
      setLocalShowQRModal(true);
    }
  };

  const closeQRModal = () => {
    console.log('[WhatsAppWebSection] 🔐 Fechando modal');
    setLocalShowQRModal(false);
    setLocalSelectedQRCode(null);
    setLocalSelectedInstanceName('');
    setIsWaitingForQR(false);
    stopPolling();
  };

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const isConnectingOrPolling = isConnecting || isPolling || isWaitingForQR;

  return (
    <div className="space-y-6">
      {/* Status de Preparação (apenas enquanto aguarda QR) */}
      {isWaitingForQR && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Preparando QR Code para "{localSelectedInstanceName}"...
              </p>
              <p className="text-xs text-blue-700">
                O modal abrirá automaticamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header com botão de conectar */}
      <WhatsAppWebSectionHeader
        onConnect={handleConnect}
        isConnecting={isConnectingOrPolling}
        isLoading={isLoading}
        companyLoading={companyLoading}
      />

      {/* Grid de instâncias ou estado vazio */}
      {isLoading || companyLoading ? (
        <WhatsAppWebLoadingState />
      ) : instances.length > 0 ? (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onRefreshQR={handleRefreshQR}
          onDelete={handleDeleteInstance}
          onShowQR={handleShowQR}
        />
      ) : (
        <WhatsAppWebEmptyState
          onConnect={handleConnect}
          isConnecting={isConnectingOrPolling}
        />
      )}

      {/* Modal QR Code */}
      <ImprovedQRCodeModal
        isOpen={localShowQRModal}
        onOpenChange={(open) => !open && closeQRModal()}
        qrCodeUrl={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
      />
    </div>
  );
};
