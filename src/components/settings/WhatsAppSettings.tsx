
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { Wifi } from "lucide-react";

const WhatsAppSettings = () => {
  console.log('[WhatsAppSettings] Component rendering - WhatsApp Web.js only');
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    loading: instancesLoading,
    error,
    refetch
  } = useWhatsAppWebInstances(companyId, companyLoading);

  console.log('[WhatsAppSettings] WhatsApp Web instances loaded:', {
    instancesCount: instances.length,
    loading: instancesLoading,
    companyLoading
  });

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      {error && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-red-400/30 shadow-2xl p-8 animate-fade-in">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-400/10 rounded-2xl">
              <Wifi className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Status da Conexão</h3>
              <p className="text-gray-700">Problemas detectados na conexão</p>
            </div>
          </div>

          <WhatsAppErrorAlert lastError={error} />
        </div>
      )}

      {/* WhatsApp Section - Removido o card wrapper */}
      <WhatsAppWebSection />
    </div>
  );
};

export default WhatsAppSettings;
