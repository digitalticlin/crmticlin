
import { Building2, Shield, CheckCircle, AlertCircle, User } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useCompanyData } from "@/hooks/useCompanyData";

interface AccountStatusCardsProps {
  userEmail?: string;
  userName?: string;
}

const AccountStatusCards = ({ userEmail, userName }: AccountStatusCardsProps) => {
  const { role, isAdmin, loading: roleLoading } = useUserRole();
  const { companyName, companyId, loading: companyLoading } = useCompanyData();

  const getRoleLabel = (userRole: string | null) => {
    switch (userRole) {
      case "admin":
        return "Administrador";
      case "manager":
        return "Gestor";
      case "operational":
        return "Operacional";
      default:
        return "Não definido";
    }
  };

  const getRoleIcon = (userRole: string | null) => {
    if (userRole === "admin") {
      return <Shield className="h-5 w-5 text-red-500" />;
    }
    return <User className="h-5 w-5 text-blue-500" />;
  };

  const getStatusIcon = () => {
    if (roleLoading || companyLoading) {
      return <div className="h-5 w-5 border-2 border-gray-300 border-t-[#D3D800] rounded-full animate-spin" />;
    }
    
    if (companyId && role) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (roleLoading || companyLoading) {
      return "Carregando...";
    }
    
    if (companyId && role) {
      return "Conta configurada";
    }
    
    if (!companyId) {
      return "Empresa não vinculada";
    }
    
    if (!role) {
      return "Permissões não definidas";
    }
    
    return "Configuração incompleta";
  };

  return (
    <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "50ms" }}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
          <CheckCircle className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Status da Conta</h3>
          <p className="text-gray-700">Informações de sincronização com o sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Geral */}
        <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500/20 rounded-lg">
              {getStatusIcon()}
            </div>
            <div>
              <p className="text-sm text-gray-700">Status Geral</p>
              <p className="text-sm font-medium text-gray-800">{getStatusText()}</p>
            </div>
          </div>
        </div>

        {/* Empresa */}
        <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Empresa</p>
              <p className="text-sm font-medium text-gray-800">
                {companyLoading ? "Carregando..." : companyName || "Não vinculada"}
              </p>
            </div>
          </div>
        </div>

        {/* Nível de Acesso */}
        <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              {getRoleIcon(role)}
            </div>
            <div>
              <p className="text-sm text-gray-700">Nível de Acesso</p>
              <p className="text-sm font-medium text-gray-800">
                {roleLoading ? "Carregando..." : getRoleLabel(role)}
              </p>
            </div>
          </div>
        </div>

        {/* Usuário */}
        <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#D3D800]/20 rounded-lg">
              <User className="h-5 w-5 text-[#D3D800]" />
            </div>
            <div>
              <p className="text-sm text-gray-700">Usuário</p>
              <p className="text-sm font-medium text-gray-800 truncate">
                {userName || userEmail || "Não identificado"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas importantes */}
      {(!companyId || !role) && (
        <div className="mt-4 p-4 bg-yellow-50/50 border border-yellow-200/50 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Atenção Necessária</p>
              <p className="text-sm text-yellow-700 mt-1">
                {!companyId && "Sua conta não está vinculada a uma empresa. "}
                {!role && "Suas permissões de acesso não estão definidas. "}
                Entre em contato com o administrador do sistema para resolver esta situação.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStatusCards;
