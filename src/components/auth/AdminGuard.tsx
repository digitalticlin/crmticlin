import React from 'react';
import { RoleGuard } from './RoleGuard';
import { Shield, Settings, Users, AlertCircle } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDeniedMessage?: boolean;
}

const AdminRequiredMessage: React.FC = () => {
  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Shield className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Área Administrativa
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          Esta funcionalidade está disponível apenas para administradores do sistema.
        </p>

        {/* Features List */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
            <span className="font-medium text-gray-700">Funcionalidades Administrativas</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center">
              <Settings className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-gray-600">Configurações do Sistema</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-gray-600">Gerenciamento de Equipe</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-gray-600">Controle de Permissões</span>
            </div>
          </div>
        </div>

        {/* Current Role Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-700">
              Você está logado como: <strong>Operacional</strong>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            Ir para Dashboard
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Voltar
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            Se você precisa de acesso administrativo, entre em contato com o administrador do sistema.
            <br />
            <span className="font-medium">Suas permissões atuais permitem acesso ao dashboard e gerenciamento dos seus leads.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  showDeniedMessage = true
}) => {
  console.log('[AdminGuard] 🔒 Verificando acesso administrativo');

  const customFallback = fallback || (showDeniedMessage ? <AdminRequiredMessage /> : null);

  return (
    <RoleGuard 
      allowedRoles={['admin']} 
      fallback={customFallback}
      showDeniedMessage={false} // AdminGuard tem sua própria mensagem
    >
      {children}
    </RoleGuard>
  );
};

export default AdminGuard;