
import { WhatsAppSettingsHeader } from "./whatsapp/WhatsAppSettingsHeader";
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import { WhatsAppPlaceholderSection } from "./whatsapp/WhatsAppPlaceholderSection";
import { WhatsAppInstancesGrid } from "./whatsapp/WhatsAppInstancesGrid";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { useWhatsAppSettingsLogic } from "@/hooks/whatsapp/useWhatsAppSettingsLogic";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering started');
  
  try {
    const {
      userEmail,
      isSuperAdmin,
      isSyncingAll,
      whatsAppHooks,
      handleSyncAllForCompany,
      refreshUserInstances
    } = useWhatsAppSettingsLogic();

    console.log('[WhatsAppSettings] Hook data loaded:', {
      userEmail,
      isSuperAdmin,
      instancesCount: whatsAppHooks.instances.length,
      isSyncingAll
    });

    // Handle showing QR code by updating state
    const handleShowQrCode = (instanceId: string) => {
      console.log('[WhatsAppSettings] handleShowQrCode called for:', instanceId);
      whatsAppHooks.setShowQrCode(instanceId);
    };

    // Modified to handle the Promise<string> return properly
    const handleConnectInstance = async (instanceId: string) => {
      console.log('[WhatsAppSettings] handleConnectInstance called for:', instanceId);
      try {
        await whatsAppHooks.connectInstance(instanceId);
        whatsAppHooks.addConnectingInstance(instanceId);
      } catch (error) {
        console.error("Error in handleConnectInstance:", error);
      }
    };

    // Handle explicit status check request from component
    const handleStatusCheck = (instanceId: string) => {
      console.log('[WhatsAppSettings] handleStatusCheck called for:', instanceId);
      whatsAppHooks.addConnectingInstance(instanceId);
    };

    console.log('[WhatsAppSettings] Rendering components...');

    return (
      <div className="space-y-6 relative">
        <WhatsAppSettingsHeader
          isSuperAdmin={isSuperAdmin}
          isSyncingAll={isSyncingAll}
          onSyncAll={handleSyncAllForCompany}
        />

        <WhatsAppInfoAlert />

        <WhatsAppErrorAlert lastError={whatsAppHooks.lastError} />

        <WhatsAppPlaceholderSection
          userEmail={userEmail}
          isSuperAdmin={isSuperAdmin}
          onRefreshInstances={refreshUserInstances}
        />

        <WhatsAppInstancesGrid
          instances={whatsAppHooks.instances}
          instanceLoading={whatsAppHooks.isLoading}
          onConnect={handleConnectInstance}
          onDelete={whatsAppHooks.deleteInstance}
          onRefreshQrCode={whatsAppHooks.refreshQrCode}
        />
      </div>
    );
  } catch (error) {
    console.error('[WhatsAppSettings] Error during rendering:', error);
    return (
      <div className="space-y-6">
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Erro ao carregar configurações do WhatsApp. Verifique o console para mais detalhes.
        </div>
      </div>
    );
  }
};

export default WhatsAppSettings;
