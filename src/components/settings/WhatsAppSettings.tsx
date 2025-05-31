
import { WhatsAppSettingsHeader } from "./whatsapp/WhatsAppSettingsHeader";
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering - WhatsApp Web.js only');
  
  try {
    const {
      instances,
      isLoading,
      lastError,
      createInstance,
      deleteInstance,
      refreshInstances
    } = useWhatsAppWebInstances();

    console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
      instancesCount: instances.length,
      isLoading
    });

    return (
      <div className="space-y-6 relative">
        <WhatsAppSettingsHeader
          isSuperAdmin={false}
          isSyncingAll={false}
          onSyncAll={() => {}}
        />

        <WhatsAppInfoAlert />

        <WhatsAppErrorAlert lastError={lastError} />

        <WhatsAppWebSection />
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
