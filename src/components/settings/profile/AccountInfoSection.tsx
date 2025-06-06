
import { Shield } from "lucide-react";

interface AccountInfoSectionProps {
  userRole: string | null;
}

const AccountInfoSection = ({ userRole }: AccountInfoSectionProps) => {
  const getRoleLabel = (role: string | null) => {
    switch (role) {
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

  if (!userRole) return null;

  return (
    <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "50ms" }}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
          <Shield className="h-6 w-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Informações da Conta</h3>
          <p className="text-gray-700">Status da sua conta no sistema</p>
        </div>
      </div>

      <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Shield className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-700">Nível de Acesso</p>
            <p className="text-sm font-medium text-gray-800">{getRoleLabel(userRole)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoSection;
