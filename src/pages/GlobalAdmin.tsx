
import { useState } from "react";
import GlobalAdminSidebar from "@/components/admin/GlobalAdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { UnifiedWhatsAppPanel } from "@/components/admin/UnifiedWhatsAppPanel";
import { BusinessManagementPanel } from "@/components/admin/BusinessManagementPanel";
import PlansPanel from "@/components/admin/PlansPanel";
import { SystemManagementPanel } from "@/components/admin/SystemManagementPanel";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";

export default function GlobalAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "whatsapp":
        return <UnifiedWhatsAppPanel />;
      case "business":
        return <BusinessManagementPanel />;
      case "plans":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Planos & Cobrança</h1>
              <p className="text-gray-600 mt-1">
                Administração de assinaturas, planos e faturamento
              </p>
            </div>
            <PlansPanel />
          </div>
        );
      case "system":
        return <SystemManagementPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      default:
        return <AdminDashboard />;
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
