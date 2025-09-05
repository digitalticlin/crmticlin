import React from 'react';
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCustomizer from "@/components/dashboard/customizer/DashboardCustomizer";
import { CustomizableKPIGrid } from "@/components/dashboard/CustomizableKPIGrid";
import CustomizableChartsSection from "@/components/dashboard/CustomizableChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { Shield, Users, Settings, BarChart3 } from "lucide-react";

const AdminDashboard: React.FC = () => {
  return (
    <>
      {/* Header personalizado para Admin */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600">Visão completa da organização - Todos os dados e métricas</p>
          </div>
        </div>

        {/* Indicadores de contexto admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Métricas Globais</p>
                <p className="text-sm text-blue-600">Dados de toda organização</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Gestão de Equipe</p>
                <p className="text-sm text-green-600">Controle total de usuários</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Configurações</p>
                <p className="text-sm text-purple-600">Acesso a todas as configurações</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Header original */}
      <DashboardHeader />
      
      {/* Seção de controles */}
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Análise de Performance - Visão Administrativa
            </h2>
            <p className="text-sm text-gray-800">
              Visualize dados de toda a organização e métricas de equipe em tempo real
            </p>
          </div>
          
          <div className="flex justify-center lg:justify-start">
            <PeriodFilter />
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <DashboardCustomizer />
          </div>
        </div>
      </div>
      
      {/* KPIs e Gráficos */}
      <div>
        <CustomizableKPIGrid />
      </div>
      
      <div>
        <CustomizableChartsSection />
      </div>

      {/* Seção adicional para admins - Insights da equipe */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 lg:p-8 shadow-md mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Insights da Equipe</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500">Membros da equipe</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Performance Média</p>
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500">Conversão da equipe</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Leads Distribuídos</p>
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-500">Atribuições ativas</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;