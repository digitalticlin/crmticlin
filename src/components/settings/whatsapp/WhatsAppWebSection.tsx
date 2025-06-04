import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { WhatsAppErrorAlert } from "./WhatsAppErrorAlert";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare } from "lucide-react";
import { ImprovedConnectWhatsAppButton } from "./ImprovedConnectWhatsAppButton";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";
import { useCompanyData } from "@/hooks/useCompanyData";
import { WhatsAppDiagnostic } from "./WhatsAppDiagnostic";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Component rendering - WhatsApp Web.js only');
  
  const [userEmail, setUserEmail] = useState<string>("");
  const { companyId, loading: companyLoading } = useCompanyData();
  
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
  } = useWhatsAppWebInstances(companyId, companyLoading);

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

  return (
    <div className="space-y-6">
      <WhatsAppErrorAlert lastError={error} />
      
      {/* Componente de Diagnóstico */}
      <WhatsAppDiagnostic />
      
      {/* Title Card with Add Button */}
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Instâncias WhatsApp</h3>
              <p className="text-gray-600 mt-1">Conecte e gerencie suas conexões do WhatsApp</p>
            </div>
          </div>
          
          <button
            onClick={handleAutoConnect}
            disabled={autoConnectState.isConnecting || instancesLoading || companyLoading}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {autoConnectState.isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>Adicionar WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instances Grid */}
      {instancesLoading || companyLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-sm text-gray-600">Carregando instâncias...</p>
          </div>
        </div>
      ) : instances.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      ) : (
        <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma instância conectada</h3>
            <p className="text-gray-600 mb-6">Conecte seu primeiro WhatsApp para começar a usar o sistema</p>
            <button
              onClick={handleAutoConnect}
              disabled={autoConnectState.isConnecting}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {autoConnectState.isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  <span>Conectar WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
