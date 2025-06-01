
import { WhatsAppSettingsHeader } from "./whatsapp/WhatsAppSettingsHeader";
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { WhatsAppWebSectionWithMonitoring } from "./whatsapp/WhatsAppWebSectionWithMonitoring";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering - WhatsApp Web.js with VPS monitoring');
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    loading: instancesLoading,
    error,
    refetch
  } = useWhatsAppWebInstances();

  console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
    instancesCount: instances.length,
    loading: instancesLoading,
    companyLoading
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

      <WhatsAppWebSectionWithMonitoring />
    </div>
  );
};

export default WhatsAppSettings;
