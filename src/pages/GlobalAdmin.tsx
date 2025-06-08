
import { useState } from "react";
import { GlobalAdminSidebar } from "@/components/admin/GlobalAdminSidebar";
import { WhatsAppTestPanel } from "@/components/admin/WhatsAppTestPanel";
import { GlobalInstanceManagement } from "@/components/admin/GlobalInstanceManagement";

export default function GlobalAdmin() {
  const [activeTab, setActiveTab] = useState("whatsapp-test");

  const renderContent = () => {
    switch (activeTab) {
      case "whatsapp-test":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Centro de Testes WhatsApp Completo</h1>
              <p className="text-gray-600 mt-1">
                Painel completo para testar e validar todo o sistema WhatsApp antes de aplicar nas configurações
              </p>
            </div>
            <WhatsAppTestPanel />
          </div>
        );
      case "instances":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Instâncias WhatsApp</h1>
              <p className="text-gray-600 mt-1">
                Sincronize e monitore todas as instâncias WhatsApp entre VPS e Supabase
              </p>
            </div>
            <GlobalInstanceManagement />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Centro de Testes WhatsApp Completo</h1>
              <p className="text-gray-600 mt-1">
                Painel completo para testar e validar todo o sistema WhatsApp antes de aplicar nas configurações
              </p>
            </div>
            <WhatsAppTestPanel />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <GlobalAdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
