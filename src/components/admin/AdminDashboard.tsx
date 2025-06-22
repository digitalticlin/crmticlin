
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { GlobalAdminSidebar } from "./GlobalAdminSidebar";

export const AdminDashboard = () => {
  return (
    <div className="flex h-full">
      <GlobalAdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/instances" replace />} />
            <Route path="/instances" element={
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Gerenciamento de Instâncias</h2>
                <p className="text-gray-600">Use o painel Global Admin em /global-admin para gerenciar instâncias.</p>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};
