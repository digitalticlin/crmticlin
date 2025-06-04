
import { WhatsAppSettingsHeader } from "./whatsapp/WhatsAppSettingsHeader";
import { WhatsAppErrorAlert } from "./whatsapp/WhatsAppErrorAlert";
import WhatsAppInfoAlert from "./whatsapp/WhatsAppInfoAlert";
import { WhatsAppWebSection } from "./whatsapp/WhatsAppWebSection";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { MessageSquare, Smartphone, Wifi } from "lucide-react";

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
      {/* Header Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
            <MessageSquare className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Configurações do WhatsApp</h3>
            <p className="text-white/70">Gerencie suas conexões e instâncias do WhatsApp</p>
          </div>
        </div>

        <WhatsAppSettingsHeader
          isSuperAdmin={false}
          isSyncingAll={false}
          onSyncAll={() => refetch()}
        />
      </div>

      {/* Info Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-2xl">
            <Smartphone className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Como Funciona</h3>
            <p className="text-white/70">Informações sobre a conexão WhatsApp Web</p>
          </div>
        </div>

        <WhatsAppInfoAlert />
      </div>

      {/* Connection Status */}
      {error && (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-red-400/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-400/10 rounded-2xl">
              <Wifi className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Status da Conexão</h3>
              <p className="text-white/70">Problemas detectados na conexão</p>
            </div>
          </div>

          <WhatsAppErrorAlert lastError={error} />
        </div>
      )}

      {/* Instances Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-[#D3D800]/20 to-[#D3D800]/10 rounded-2xl">
            <MessageSquare className="h-6 w-6 text-[#D3D800]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Instâncias WhatsApp</h3>
            <p className="text-white/70">Conecte e gerencie suas instâncias do WhatsApp</p>
          </div>
        </div>

        <WhatsAppWebSection />
      </div>
    </div>
  );
};

export default WhatsAppSettings;
