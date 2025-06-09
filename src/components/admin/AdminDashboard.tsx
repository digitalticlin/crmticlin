
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
  return (
    <div className="flex h-full">
      <GlobalAdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/analytics" replace />} />
            <Route path="/analytics" element={<AnalyticsPanel />} />
            <Route path="/companies" element={<CompaniesPanel />} />
            <Route path="/users" element={<UsersPanel />} />
            <Route path="/whatsapp" element={<WhatsAppPanel />} />
            <Route path="/vps-diagnostics" element={<VPSDiagnosticsSection />} />
            <Route path="/plans" element={<PlansPanel />} />
            <Route path="/system" element={<SystemHealthDashboard />} />
            <Route path="/logs" element={<LogsPanel />} />
            <Route path="/test" element={<ModularTestPanel />} />
            <Route path="/config" element={<ConfigPanel />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
