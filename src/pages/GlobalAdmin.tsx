
import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { GlobalAdminSidebar } from "@/components/admin/GlobalAdminSidebar";
import { GlobalInstanceManagement } from "@/components/admin/GlobalInstanceManagement";

export default function GlobalAdmin() {
  const location = useLocation();
  
  // Extrair a seção atual da URL
  const getCurrentSection = () => {
    const path = location.pathname.replace('/global-admin/', '').replace('/global-admin', '');
    return path || 'instances';
  };

  const currentSection = getCurrentSection();

  const renderPageHeader = () => {
    const headers = {
      'instances': {
        title: 'Gerenciamento de Instâncias',
        description: 'Sincronizar e monitorar instâncias WhatsApp globalmente'
      }
    };

    const header = headers[currentSection as keyof typeof headers] || headers.instances;

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
            <Route path="/" element={<Navigate to="/global-admin/instances" replace />} />
            <Route path="/instances" element={<GlobalInstanceManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
