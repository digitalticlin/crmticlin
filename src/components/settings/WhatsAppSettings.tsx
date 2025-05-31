
import { WhatsAppSettingsHeader } from "./whatsapp/WhatsAppSettingsHeader";
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering - WhatsApp Web.js only');
  
  const { companyId } = useCompanyData();
  
  const {
    instances,
    loading,
    error,
    refetch
  } = useWhatsAppWebInstances(companyId);

  console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
    instancesCount: instances.length,
    loading
  });

  return (
    <div className="space-y-6 relative">
      <WhatsAppSettingsHeader
        isSuperAdmin={false}
        isSyncingAll={false}
        onSyncAll={() => refetch()}
      />

      <WhatsAppInfoAlert />

      <WhatsAppErrorAlert lastError={error} />

      <WhatsAppWebSection />
    </div>
  );
};

export default WhatsAppSettings;
