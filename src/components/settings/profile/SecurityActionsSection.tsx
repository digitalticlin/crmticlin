
import { Shield } from "lucide-react";
import SecuritySection from "../SecuritySection";

interface SecurityActionsSectionProps {
  email: string;
  onChangePassword: () => Promise<void>;
}

const SecurityActionsSection = ({ email, onChangePassword }: SecurityActionsSectionProps) => {
  return (
    <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-400/10 rounded-2xl">
          <Shield className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Segurança da Conta</h3>
          <p className="text-gray-700">Gerencie a segurança da sua conta</p>
        </div>
      </div>
      
      <SecuritySection 
        email={email}
        onChangePassword={onChangePassword}
      />
    </div>
  );
};

export default SecurityActionsSection;
