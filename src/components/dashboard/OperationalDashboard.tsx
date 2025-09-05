import React from 'react';
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CustomizableKPIGrid } from "@/components/dashboard/CustomizableKPIGrid";
import CustomizableChartsSection from "@/components/dashboard/CustomizableChartsSection";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import { User, Target, TrendingUp, MessageSquare, Clock } from "lucide-react";

const OperationalDashboard: React.FC = () => {
  return (
    <>
      {/* Header personalizado para Operacional */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Dashboard</h1>
            <p className="text-gray-600">Seus leads, suas métricas, seu desempenho</p>
          </div>
        </div>

        {/* Indicadores de contexto operacional */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Meus Leads</p>
                <p className="text-sm text-green-600">Apenas seus atribuídos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Minha Performance</p>
                <p className="text-sm text-blue-600">Resultados pessoais</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Conversas</p>
                <p className="text-sm text-purple-600">WhatsApp atribuído</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Tempo Resposta</p>
                <p className="text-sm text-orange-600">Sua média pessoal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Header original */}
      <DashboardHeader />
      
      {/* Seção de controles - simplificada para operacional */}
      <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Minha Análise de Performance
            </h2>
            <p className="text-sm text-gray-800">
              Acompanhe seus leads e métricas pessoais em tempo real
            </p>
          </div>
          
          <div className="flex justify-center lg:justify-start">
            <PeriodFilter />
          </div>
          
          {/* Operacionais não têm acesso ao customizador completo */}
          <div className="flex justify-center lg:justify-end">
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
              Visualização padrão
            </div>
          </div>
        </div>
      </div>
      
      {/* KPIs e Gráficos - mesmos componentes mas dados filtrados por owner_id */}
      <div>
        <CustomizableKPIGrid />
      </div>
      
      <div>
        <CustomizableChartsSection />
      </div>

      {/* Seção adicional para operacionais - Dicas e metas */}
      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 lg:p-8 shadow-md mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Seus Objetivos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Meta de Conversão</p>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Meta</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">15%</p>
              <p className="text-sm text-gray-500">objetivo</p>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Leads/Semana</p>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Atuais</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-500">leads</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Média semanal</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Tempo Resposta</p>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Meta</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">&lt;5min</p>
              <p className="text-sm text-gray-500">objetivo</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Resposta média desejada</p>
          </div>
        </div>

        {/* Dicas para operacionais */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dica do dia</h4>
          <p className="text-sm text-blue-700">
            Responder rapidamente aos leads aumenta suas chances de conversão em até 35%. 
            Use o WhatsApp Chat para acompanhar suas conversas em tempo real.
          </p>
        </div>
      </div>
    </>
  );
};

export default OperationalDashboard;