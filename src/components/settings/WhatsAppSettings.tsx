
import { WhatsAppSettingsHeader } from "./whatsapp/WhatsAppSettingsHeader";
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import { WhatsAppPlaceholderSection } from "./whatsapp/WhatsAppPlaceholderSection";
import { WhatsAppInstancesGrid } from "./whatsapp/WhatsAppInstancesGrid";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { useWhatsAppSettingsLogic } from "@/hooks/whatsapp/useWhatsAppSettingsLogic";

const WhatsAppSettings = () => {
  const {
    userEmail,
    isSuperAdmin,
    isSyncingAll,
    whatsAppHooks,
    handleSyncAllForCompany,
    refreshUserInstances
  } = useWhatsAppSettingsLogic();

  // Handle showing QR code by updating state
  const handleShowQrCode = (instanceId: string) => {
    whatsAppHooks.setShowQrCode(instanceId);
  };

  // Modified to handle the Promise<string> return properly
  const handleConnectInstance = async (instanceId: string) => {
    try {
      await whatsAppHooks.connectInstance(instanceId);
      whatsAppHooks.addConnectingInstance(instanceId);
    } catch (error) {
      console.error("Error in handleConnectInstance:", error);
    }
  };

  // Handle explicit status check request from component
  const handleStatusCheck = (instanceId: string) => {
    whatsAppHooks.addConnectingInstance(instanceId);
  };

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
};

export default WhatsAppSettings;
