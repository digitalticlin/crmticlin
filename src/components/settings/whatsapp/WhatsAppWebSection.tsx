import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { WhatsAppErrorAlert } from "./WhatsAppErrorAlert";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import FloatingAddWhatsAppButton from "./FloatingAddWhatsAppButton";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { VPSHealthDiagnostic } from "./VPSHealthDiagnostic";
import { ImprovedConnectWhatsAppButton } from "./ImprovedConnectWhatsAppButton";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Component rendering - WhatsApp Web.js only');
  
  const [userEmail, setUserEmail] = useState<string>("");
  
  const {
    instances,
    loading: instancesLoading,
    error,
    createInstance,
    deleteInstance,
    refreshQRCode,
    startAutoConnection,
    closeQRModal,
    openQRModal,
    autoConnectState,
    refetch
  } = useWhatsAppWebInstances("", false);

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

  const handleAutoConnect = async () => {
    console.log('[WhatsAppWebSection] Auto connect requested');
    startAutoConnection();
  };

  const handleCreateNew = async (instanceName: string) => {
    console.log('[WhatsAppWebSection] Creating new instance:', instanceName);
    await createInstance(instanceName);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Refreshing QR code for instance:', instanceId);
    await refreshQRCode(instanceId);
  };

  const getActiveInstanceQRCode = () => {
    if (!autoConnectState.activeInstanceId) return null;
    const activeInstance = instances.find(i => i.id === autoConnectState.activeInstanceId);
    return activeInstance?.qr_code || null;
  };

  const renderContent = () => {
    if (instancesLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Carregando instâncias...</p>
          </div>
        </div>
      );
    }

    if (instances.length === 0) {
      return (
        <div className="space-y-6">
          <VPSHealthDiagnostic />
          <ImprovedConnectWhatsAppButton 
            onConnect={handleAutoConnect}
            isConnecting={autoConnectState.isConnecting}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <VPSHealthDiagnostic />
        
        <div className="grid gap-4">
          {instances.map((instance) => (
            <WhatsAppWebInstanceCard
              key={instance.id}
              instance={instance}
              onRefreshQR={handleRefreshQR}
              onDelete={handleDeleteInstance}
              onShowQR={() => openQRModal(instance.id)}
            />
          ))}
        </div>

        <FloatingAddWhatsAppButton 
          onClick={() => handleCreateNew(`instance_${Date.now()}`)}
          isSuperAdmin={true}
          isNewUser={instances.length === 0}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <WhatsAppErrorAlert lastError={error} />
      
      {renderContent()}

      <ImprovedQRCodeModal
        isOpen={autoConnectState.showQRModal}
        onOpenChange={(open) => !open && closeQRModal()}
        qrCode={getActiveInstanceQRCode()}
        isLoading={false}
        onRefresh={async () => {
          if (autoConnectState.activeInstanceId) {
            return await refreshQRCode(autoConnectState.activeInstanceId);
          }
          return null;
        }}
      />
    </div>
  );
};
