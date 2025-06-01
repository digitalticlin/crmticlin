
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering - simplified layout');
  
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
    <div className="space-y-6">
      {/* Simple header */}
      <div>
        <h2 className="text-xl font-semibold">WhatsApp</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conecte e gerencie suas instâncias WhatsApp
        </p>
      </div>

      {/* Main content */}
      <WhatsAppWebSection />
    </div>
  );
};

export default WhatsAppSettings;
