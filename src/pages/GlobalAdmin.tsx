
import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { GlobalAdminSidebar } from "@/components/admin/GlobalAdminSidebar";
import { WhatsAppTestPanel } from "@/components/admin/WhatsAppTestPanel";
import { GlobalInstanceManagement } from "@/components/admin/GlobalInstanceManagement";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import CompaniesPanel from "@/components/admin/CompaniesPanel";
import UsersPanel from "@/components/admin/UsersPanel";
import WhatsAppPanel from "@/components/admin/WhatsAppPanel";
import { VPSDiagnosticsSection } from "@/components/admin/VPSDiagnosticsSection";
import PlansPanel from "@/components/admin/PlansPanel";
import { SystemHealthDashboard } from "@/components/admin/SystemHealthDashboard";
import LogsPanel from "@/components/admin/LogsPanel";
import { ModularTestPanel } from "@/components/admin/ModularTestPanel";
import ConfigPanel from "@/components/admin/ConfigPanel";

export default function GlobalAdmin() {
  const location = useLocation();
  
  // Extrair a seção atual da URL
  const getCurrentSection = () => {
    const path = location.pathname.replace('/global-admin/', '').replace('/global-admin', '');
    return path || 'analytics';
  };

  const currentSection = getCurrentSection();

  const renderPageHeader = () => {
    const headers = {
      'analytics': {
        title: 'Analytics do Sistema',
        description: 'Métricas e análises globais do sistema'
      },
      'companies': {
        title: 'Gerenciamento de Empresas',
        description: 'Administrar todas as empresas cadastradas'
      },
      'users': {
        title: 'Gerenciamento de Usuários',
        description: 'Administrar todos os usuários do sistema'
      },
      'whatsapp': {
        title: 'Painel WhatsApp Global',
        description: 'Gerenciar todas as instâncias WhatsApp do sistema'
      },
      'vps-diagnostics': {
        title: 'Diagnósticos VPS',
        description: 'Ferramentas de diagnóstico e correção da VPS'
      },
      'plans': {
        title: 'Gerenciamento de Planos',
        description: 'Administrar planos e assinaturas'
      },
      'system': {
        title: 'Saúde do Sistema',
        description: 'Monitoramento e status de todos os serviços'
      },
      'logs': {
        title: 'Logs do Sistema',
        description: 'Visualizar logs de sistema e sincronização'
      },
      'test': {
        title: 'Centro de Testes',
        description: 'Ferramentas de teste e diagnóstico avançado'
      },
      'config': {
        title: 'Configurações Globais',
        description: 'Configurações avançadas do sistema'
      },
      'whatsapp-test': {
        title: 'Centro de Testes WhatsApp',
        description: 'Painel completo para testar todo o sistema WhatsApp'
      },
      'instances': {
        title: 'Gerenciamento de Instâncias',
        description: 'Sincronizar e monitorar instâncias WhatsApp'
      }
    };

    const header = headers[currentSection as keyof typeof headers] || headers.analytics;

    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{header.title}</h1>
        <p className="text-gray-600 mt-1">{header.description}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <GlobalAdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderPageHeader()}
          
          <Routes>
            <Route path="/" element={<Navigate to="/global-admin/analytics" replace />} />
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
            <Route path="/whatsapp-test" element={<WhatsAppTestPanel />} />
            <Route path="/instances" element={<GlobalInstanceManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
