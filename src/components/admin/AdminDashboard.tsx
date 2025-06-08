
import React, { useState } from "react";
import { GlobalAdminSidebar } from "./GlobalAdminSidebar";
import { AnalyticsPanel } from "./AnalyticsPanel";
import CompaniesPanel from "./CompaniesPanel";
import UsersPanel from "./UsersPanel";
import WhatsAppPanel from "./WhatsAppPanel";
import { VPSDiagnosticsSection } from "./VPSDiagnosticsSection";
import PlansPanel from "./PlansPanel";
import { SystemHealthDashboard } from "./SystemHealthDashboard";
import LogsPanel from "./LogsPanel";
import { ModularTestPanel } from "./ModularTestPanel";
import ConfigPanel from "./ConfigPanel";

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("analytics");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "analytics":
        return <AnalyticsPanel />;
      case "companies":
        return <CompaniesPanel />;
      case "users":
        return <UsersPanel />;
      case "whatsapp":
        return <WhatsAppPanel />;
      case "vps-diagnostics":
        return <VPSDiagnosticsSection />;
      case "plans":
        return <PlansPanel />;
      case "system":
        return <SystemHealthDashboard />;
      case "logs":
        return <LogsPanel />;
      case "test":
        return <ModularTestPanel />;
      case "config":
        return <ConfigPanel />;
      default:
        return <AnalyticsPanel />;
    }
  };

  return (
    <div className="flex h-full">
      <GlobalAdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};
